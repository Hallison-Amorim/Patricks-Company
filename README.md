# EMPREST.AI — API (backend)

API do sistema interno de empréstimo de equipamentos de TI da Operações.
Hoje ela expõe apenas as rotas de serviço/health; as features do PRD
(catálogo, solicitação, devolução) entram por domínio em
`src/modules/<dominio>/`.

## Stack

Definida no ADR-001 (`docs/adr/001-stack.md` do workspace):

- Node.js LTS · TypeScript `strict` · NestJS
- Adapter serverless: Express via `@vendia/serverless-express`, com a
  instância do Nest cacheada fora do handler
- Validação de entrada com Zod (`nestjs-zod`) · Prisma + PostgreSQL
  (Supabase) — entram nas próximas specs
- Testes: Jest (`*.spec.ts` unitários, `*.e2e-spec.ts` de integração)

## Endpoints

| Método | Rota           | Descrição                          |
|--------|----------------|------------------------------------|
| GET    | `/`            | informações do serviço (JSON)      |
| GET    | `/api`         | idem, para a URL da Vercel         |
| GET    | `/api/health`  | health check                       |
| GET    | `/health`      | health check (atalho)              |

Resposta de health:

```json
{
  "status": "ok",
  "service": "emprest-ai-api",
  "version": "0.1.0",
  "timestamp": "2026-10-19T12:00:00.000Z",
  "uptimeSeconds": 12
}
```

## Rodando local

```bash
npm install
npm run dev     # servidor local em http://localhost:3000
npm test        # Jest
npm run build   # tsc -> dist/
npm start       # roda o build
```

## Variáveis de ambiente

O modelo versionado está em `.env.example`; o `.env` real nunca é
commitado (`.gitignore`). Nenhuma variável é obrigatória para subir hoje:

| Variável            | Uso                                             | Padrão |
|---------------------|-------------------------------------------------|--------|
| `PORT`              | porta do servidor local                         | `3000` |
| `CORS_ORIGIN`       | origem permitida (vírgula separa várias)        | libera qualquer origem |
| `API_PREFIX`        | prefixo previsto para a API (`/api`)            | `api`  |
| `DATABASE_URL`      | Prisma/Postgres — usado nas próximas specs      | —      |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | autenticação — próximas specs         | —      |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | auth/RLS — próximas specs | —      |

No painel da Vercel (preview e production) essas mesmas variáveis precisam
ser cadastradas à mão — só existe `.env.example` e `.env` local.

## Deploy (Vercel)

- Projeto Vercel `patricks-company` apontando para este repositório.
- Entry: `api/index.ts` + `vercel.json` (rewrites de `/` e `/api/*` para a
  function), preset "Other" — sem build estático.
- `engines.node` fixado em `22.x` (LTS) por compatibilidade com
  `@vendia/serverless-express@4`.
- A aplicação Nest é criada uma única vez por container e cacheada fora
  do handler (ADR-001 §3).

## Estrutura

```
api/index.ts          handler da Vercel (Nest + serverless-express)
src/main.ts           bootstrap do servidor local
src/app.ts            fábrica da aplicação (compartilhada)
src/app.module.ts     módulo raiz
src/modules/<dom>/    por domínio: controller -> service -> repository
```
