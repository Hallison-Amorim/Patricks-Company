import "reflect-metadata";

import type { IncomingMessage, ServerResponse } from "node:http";
import serverlessExpress from "@vendia/serverless-express";

import { createApp } from "../src/app";

/**
 * O @vendia/serverless-express só reconhece eventos AWS/Azure por detecção
 * automática; na Vercel a function recebe (req, res) de Node http. A lib
 * prevê isso com `eventSource` customizado — este arquivo define a fonte
 * "VERCEL" (getRequest/getResponse) e mantém o adapter cacheado fora do
 * handler, como manda o ADR-001 §3.
 */

interface VercelEvent {
  req: IncomingMessage;
  body?: Buffer;
  rebuiltBody?: boolean;
}

interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string | string[] | number | undefined>;
  body: string;
  isBase64Encoded: boolean;
}

type ServerlessHandler = (
  event: VercelEvent,
  context: Record<string, unknown>,
) => Promise<ProxyResponse>;

const vercelEventSource = {
  getRequest: ({ event }: { event: VercelEvent }) => {
    const headers = { ...event.req.headers };
    if (event.rebuiltBody) {
      // corpo re-serializado: o content-length original não confere mais
      delete headers["content-length"];
    }

    return {
      method: event.req.method,
      headers,
      body: event.body,
      remoteAddress: event.req.socket?.remoteAddress ?? "",
      path: event.req.url ?? "/",
    };
  },
  getResponse: ({
    statusCode,
    headers,
    body,
    isBase64Encoded,
  }: ProxyResponse) => {
    const responseHeaders = { ...headers };
    // a resposta é enviada completa em um único res.end()
    delete responseHeaders["transfer-encoding"];
    delete responseHeaders["connection"];

    return { statusCode, headers: responseHeaders, body, isBase64Encoded };
  },
};

/**
 * Instância cacheada FORA do handler (ADR-001 §3 — "adapter serverless
 * com instância cacheada"): sem isso, cada request pagaria o bootstrap do
 * container de DI do Nest. Guardamos a promise para que cold starts
 * concorrentes não montem a aplicação duas vezes.
 */
let handlerPromise: Promise<ServerlessHandler> | undefined;

async function bootstrap(): Promise<ServerlessHandler> {
  const app = await createApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  const handler = serverlessExpress({
    app: expressApp,
    eventSourceName: "VERCEL",
    eventSource: vercelEventSource,
  });

  return handler as unknown as ServerlessHandler;
}

function getHandler(): Promise<ServerlessHandler> {
  handlerPromise ??= bootstrap();
  return handlerPromise;
}

/**
 * A Vercel pode repassar o caminho de destino do rewrite (/api/index)
 * em vez do caminho pedido pelo navegador (/api/health). Normalizamos
 * para que as rotas do Nest casem nos dois casos.
 */
function normalizeUrl(req: IncomingMessage): void {
  const url = req.url ?? "/";

  if (url === "/api/index" || url === "/api/index/") {
    req.url = "/api";
  } else if (url.startsWith("/api/index/")) {
    req.url = `/api/${url.slice("/api/index/".length)}`;
  }
}

/**
 * Lê o corpo do request. A Vercel pode já ter consumido o stream e deixar
 * o resultado em `req.body` (string, Buffer ou objeto parseado); nesse
 * caso reaproveitamos e sinalizamos que o body foi re-serializado.
 */
async function readBody(
  req: IncomingMessage & { body?: unknown },
): Promise<{ body?: Buffer; rebuiltBody?: boolean }> {
  const preParsed = req.body;

  if (Buffer.isBuffer(preParsed)) {
    return { body: preParsed };
  }
  if (typeof preParsed === "string") {
    return { body: Buffer.from(preParsed) };
  }
  if (preParsed && typeof preParsed === "object") {
    return { body: Buffer.from(JSON.stringify(preParsed)), rebuiltBody: true };
  }
  if (req.readableEnded) {
    return {};
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? { body: Buffer.concat(chunks) } : {};
}

function writeResponse(res: ServerResponse, result: ProxyResponse): void {
  res.statusCode = result.statusCode;

  for (const [name, value] of Object.entries(result.headers ?? {})) {
    if (value !== undefined) {
      res.setHeader(name, value);
    }
  }

  if (result.isBase64Encoded) {
    res.end(Buffer.from(result.body ?? "", "base64"));
  } else {
    res.end(result.body ?? "");
  }
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  normalizeUrl(req);

  const { body, rebuiltBody } = await readBody(req);

  try {
    const serverlessHandler = await getHandler();
    const result = await serverlessHandler({ req, body, rebuiltBody }, {});
    writeResponse(res, result);
  } catch (error) {
    console.error("[emprest-ai-api] request failed:", error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({ status: "error", message: "Internal Server Error" }),
      );
    }
  }
}
