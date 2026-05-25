# Fase 1 - Pre-requisitos de Ambiente e Repositorio

## Objetivo
Listar o que precisa existir antes de qualquer implementacao seria.

## Regra de stack
As tecnologias obrigatorias desta especificacao estao definidas em `00-stack-obrigatorio.md`. Este arquivo nao abre alternativa de stack.

## Estrutura-alvo do repositorio
```txt
/apps
  /web
  /admin
  /api

/packages
  /config
  /types
  /ui
  /utils
```

## Ambientes obrigatorios
- development
- staging
- production

## Dependencias estruturais obrigatorias
- Node.js 22+
- TypeScript strict
- Next.js
- Express.js
- PostgreSQL
- Redis
- Docker
- Docker Compose
- Prisma
- BullMQ
- NGINX

## Variaveis obrigatorias minimas
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `REFRESH_TOKEN_SECRET`
- `TWO_FA_ENCRYPTION_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BUCKET_NAME`
- `AWS_REGION`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_WEBHOOK_SECRET`

## Entregaveis desta fase
- convencoes de rotas
- convencoes de resposta
- convencoes de seguranca
- estrutura de repositorio aceita
- stack obrigatorio aceito
