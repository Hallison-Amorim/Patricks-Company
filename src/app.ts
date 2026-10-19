import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

/**
 * Cria a aplicação Nest usada pelos dois modos de execução:
 * servidor local (src/main.ts) e function da Vercel (api/index.ts).
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: allowedOrigins
      ? allowedOrigins
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : true,
  });

  return app;
}
