# Fase 1 - Stack Obrigatorio

## Regra
As tecnologias desta secao sao obrigatorias para a implementacao inicial. A LLM nao deve substitui-las, misturá-las com alternativas nem propor outra stack sem revisao explicita desta especificacao.

## Estrutura do repositorio
- Monorepo

## Frontend loja
- Next.js
- TypeScript strict
- TailwindCSS
- Zod
- TanStack Query

## Frontend admin
- Next.js
- TypeScript strict
- TailwindCSS
- shadcn/ui
- TanStack Table
- React Hook Form
- Zod
- TanStack Query
- Zustand
- Recharts

## Backend
- Node.js 22+
- TypeScript strict
- Express.js
- Zod
- Pino

## Banco e cache
- PostgreSQL
- Prisma ORM
- Redis

## Filas e jobs
- BullMQ

## Storage e CDN
- AWS S3
- Cloudflare CDN

## Autenticacao e seguranca
- JWT `RS256`
- Refresh token opaco com rotacao
- Argon2id
- TOTP para 2FA admin
- AES-256-GCM para segredos criptografados
- Helmet

## Observabilidade
- Sentry
- Prometheus
- Grafana

## Infra e entrega
- Docker
- Docker Compose
- NGINX
- GitHub Actions

## Pagamentos
- Mercado Pago
- Checkout transparente embedded
- Webhooks oficiais

## Regras de proibicao
- Nao usar NestJS.
- Nao usar localStorage para refresh token.
- Nao usar storage local persistente.
- Nao usar WebSocket como mecanismo inicial de realtime.
- Nao usar outro gateway de pagamento como base do primeiro ciclo.
