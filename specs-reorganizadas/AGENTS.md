# AGENTS

## Objetivo deste arquivo
Este arquivo orienta qualquer agente que continue a implementacao deste projeto.
Ele resume o contexto canônico, registra o estado atual do repositório e fixa como a execução deve prosseguir.

## Regra máxima
- Seguir `specs-reorganizadas/` como unica fonte de verdade.
- Nao inventar arquitetura, fluxo, endpoint, entidade, provider, enum ou regra fora da especificacao consolidada.
- Se houver conflito entre conveniencia e especificacao, seguir a especificacao.
- Se houver lacuna real, parar e apontar exatamente o arquivo e a ambiguidade antes de editar.

## Ordem obrigatória de leitura
Antes de qualquer alteracao, ler nesta ordem:

1. `00-indice-geral.md`
2. `01-fase-inicializacao/00-stack-obrigatorio.md`
3. `01-fase-inicializacao/02-decisoes-canonicas.md`
4. `01-fase-inicializacao/03-correcoes-logicas-e-ambiguidade.md`
5. `01-fase-inicializacao/06-seguranca-obrigatoria.md`
6. `01-fase-inicializacao/07-padrao-frontend-obrigatorio.md`
7. `01-fase-inicializacao/08-padrao-backend-obrigatorio.md`
8. `01-fase-inicializacao/11-principios-canonicos-do-dominio.md`
9. `01-fase-inicializacao/12-schema-canonico-completo.md`
10. `02-fase-plataforma-base/` inteira

## Stack obrigatória
- Monorepo
- Node.js 22+
- TypeScript strict
- Express
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Zod
- Pino
- JWT `RS256`
- Refresh token opaco com rotacao
- Argon2id
- TOTP admin
- AES-256-GCM para segredos

## Estrutura obrigatória do repositório
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

## Estado atual do projeto
A **Fase 2 (Plataforma Base) esta FECHADA** (2026-05-26).
A **Fase 3 (Catalogo e Conteudo) esta em implementacao** (2026-05-27).

### Ja implementado (Fase 2 completa + Fase 3 parcial)
- estrutura base do monorepo (`apps/*`, `packages/*`, npm workspaces)
- `package.json` raiz com `npm workspaces` e engine `node >= 22.0.0`
- TypeScript strict compartilhado (`tsconfig.base.json`)
- fundacao de `apps/api` com Express + prefixo `/api/v1`
- bootstrap Express com `helmet`, `cookie-parser`, `express.json`, `traceMiddleware`
- envelope padrao de API (success/error com `traceId`)
- hierarquia de erros tipados (12 classes, ver secao "Local principal")
- `traceId` por request via `AsyncLocalTraceProvider` (AsyncLocalStorage)
- logging com Pino, redaction e request logger com campo `module`
- middleware de validacao com Zod (`validateRequest`)
- health check de `database` e `redis`
- container custom minimo para DI (`Container` com `register`/`resolve`)
- contratos obrigatorios de providers (ver secao "Local principal")
- Prisma schema: 19 modelos, 6 enums (ver secao "Local principal")
- providers implementados: Prisma (user, session, rbac, audit, category, product, variant, media, banner), Redis (permission cache, public cache), BullMQ (queue), JWT (token)
- stubs para providers externos: storage, email, payment, shipping
- SSE real com Redis Pub/Sub com rotas `/api/v1/admin/events` e `/api/v1/user/events`
- auth completo: login, register, refresh, logout, 2FA TOTP, backup codes, step-up, RBAC
- rate limit: login 5/min, refresh 10/min, register 3/min, 2FA 10/min, step-up 5/min, admin 60/min
- metricas Prometheus (4 custom + default Node.js)
- Sentry error tracking integrado
- endpoint `/metrics` (sem auth, formato Prometheus)
- seeds: roles, permissoes, tecidos, tamanhos, cores, admin bootstrap
- migrations SQL: `20260526000000_init` (base) + `20260527000000_fase3_catalogo` (catalogo)

### Fase 3 - Catalogo implementado
- **6 novos modelos Prisma**: `Category`, `Product`, `ProductVariant`, `ProductMedia`, `ProductCustomizationPreset`, `Banner`
- **3 novos enums**: `ProductStatus`, `MediaType`, `BannerStatus`
- **6 novos providers**: `PrismaCategoryProvider`, `PrismaProductProvider`, `PrismaProductVariantProvider`, `PrismaProductMediaProvider`, `PrismaBannerProvider`, `RedisPublicCacheProvider`
- **4 novos modulos**:
  - `categories/` — CRUD admin + listagem publica com cache Redis
  - `products/` — CRUD admin com variantes, publicacao, listagem publica com filtros e busca
  - `banners/` — CRUD admin + listagem publica de banners ativos
  - `media/` — registro, presign upload, reordenação, delete
- **Endpoints admin**: GET/POST/PATCH/DELETE categorias, GET/POST/PATCH produtos, publish/archive, CRUD banners, CRUD media
- **Endpoints publicos**: GET /categories, GET /categories/:slug, GET /products, GET /products/:slug, GET /banners
- **Cache Redis publico**: produtos, categorias, banners com TTL 5min e invalidacao em mutations

### Conflitos ja resolvidos
Mesmo com uma definicao textual posterior dizendo que o login "retorna refreshToken", a implementacao seguiu a regra mais restritiva e canonica de seguranca:
- refresh token nao vai em JSON
- refresh token vai apenas em cookie

## Local principal da implementacao
- API bootstrap: `apps/api/src/app/create-app.ts`
- servidor: `apps/api/src/server.ts`
- DI: `apps/api/src/container/container.ts` e `apps/api/src/container/build-container.ts`
- schema Prisma: `apps/api/prisma/schema.prisma`
- seed Prisma: `apps/api/prisma/seed.ts`
- migrations: `apps/api/prisma/migrations/`
- auth: `apps/api/src/modules/auth/` (service, controller, routes, middleware, schemas, tests)
- health: `apps/api/src/modules/health/`
- SSE: `apps/api/src/modules/sse/routes/sse.routes.ts`
- catalogo: `apps/api/src/modules/catalog/`
  - `categories/` (schemas, services, controllers, routes)
  - `products/` (schemas, services, controllers, routes)
  - `banners/` (schemas, services, controllers, routes)
  - `media/` (schemas, services, controllers, routes)
- contracts: `apps/api/src/providers/contracts.ts`
- providers catalogo: `category.provider.ts`, `product.provider.ts`, `product-variant.provider.ts`, `product-media.provider.ts`, `banner.provider.ts`, `public-cache.provider.ts`
- erros: `apps/api/src/core/errors/` (12 classes: BaseAppError, AuthError, ValidationError, RbacError, RateLimitError, RequestError, ResourceError, InternalServerError, ExternalError, PaymentError, OrderError, CheckoutError)
- validacao: `apps/api/src/core/validation/validate-request.ts`
- rate limit: `apps/api/src/core/rate-limit/rate-limit.middleware.ts`
- trace: `apps/api/src/core/trace/trace-middleware.ts` e `trace-provider.ts`
- logger: `apps/api/src/core/logging/logger.ts` e `request-logger.middleware.ts`
- crypto: `apps/api/src/core/security/crypto.util.ts` e `password.util.ts`
- config: `apps/api/src/config/` (env.ts, auth.ts, redis-keys.ts)
- tokens DI: `apps/api/src/providers/tokens.ts`
- SSE provider: `apps/api/src/providers/sse.provider.ts`
- queue names: `apps/api/src/queues/queue-names.ts`
- job names: `apps/api/src/queues/job-names.ts`
- workers: `apps/api/src/queues/workers/` (6 workers)
- Sentry: `apps/api/src/core/observability/sentry.ts`
- metrics: `apps/api/src/core/metrics/metrics.ts` e `metrics.middleware.ts`

## Decisoes operacionais ja fechadas nesta execucao

### Refresh token
Implementacao canonica adotada:
- token opaco randomico 256-bit
- nunca JWT
- enviado apenas via cookie `HttpOnly Secure SameSite=Strict`
- lookup por `refreshTokenLookupHash = SHA-256(rawRefreshToken)`
- verificacao por `refreshTokenHash = Argon2id(rawRefreshToken)`
- suporte a:
  - rotacao
  - `previousRefreshTokenLookupHash`
  - `previousRefreshTokenHash`
  - reuse detection
  - marcacao de sessao comprometida

### Schema de sessao
Implementacao canonica adotada (evoluiu do schema das specs):
- `chainId` em vez de `chainToken`/`prevChainToken`
- `refreshTokenLookupHash` (unico) + `refreshTokenHash`
- `previousRefreshTokenLookupHash` + `previousRefreshTokenHash`
- `permissionsVersion` para invalidacao de cache
- `isTwoFactorVerified` e `stepUpVerifiedAt` na sessao
- `revokedAt` e `compromisedAt` em vez de `isRevoked`
- `replacedBySessionId` para rastreamento de cadeia
- `tokenVersion` na sessao para sincronizar com `User.tokenVersion`

### User type
- `User.userType` (enum `UserType: CUSTOMER | ADMIN | SYSTEM`) em vez de depender apenas de roles
- campo presente no schema Prisma para distincao rapida

### Nomes de filas obrigatorias (IMPLEMENTADO 2026-05-26)
Constantes em `apps/api/src/queues/queue-names.ts`:
- `email` - worker: envio de emails transacionais e templates
- `audit` - worker: persistencia de eventos de auditoria
- `image-processing` - worker: compressao e geracao responsiva (stub)
- `order-events` - worker: broadcast SSE para status de pedidos
- `payment-webhooks` - worker: processamento e broadcast de pagamentos
- `sse-broadcast` - worker: broadcast SSE por escopo (ADMIN/USER/SYSTEM)

Job names definidos em `apps/api/src/queues/job-names.ts`.
Workers em `apps/api/src/queues/workers/`.
Provider refactorado com singleton de Queue e graceful shutdown.

### SSE com Redis Pub/Sub (IMPLEMENTADO 2026-05-26)
- `RedisPubSubSseProvider` substituiu o `NativeSseProvider` (no-op)
- Redis Pub/Sub com `pscribe` pattern `coremd:{APP_ENV}:sse:*`
- heartbeat a cada 30s
- max 5 conexoes por usuario
- roteamento por escopo: ADMIN, USER, SYSTEM
- shutdown graceful com cleanup de conexoes

### Testes (2026-05-27)
- 20 arquivos de teste, 94 testes, todos passando
- cobertura: erros (hierarquia + handler), validacao, crypto, password, trace, container DI, queue names, job names, rate limit, health controller, token provider, require-permission middleware, auth config, redis keys, metrics Prometheus, integracao HTTP com supertest (register, login, me, refresh, health, metrics)

## Fase 2 - Status: CONCLUIDA (2026-05-26)

## Fase 3 - Status: IMPLEMENTADA (2026-05-27)
Schema, providers, modulos e rotas implementados.
Pendencias: seeds expandidos e testes de integracao para catalogo.
Proximo passo: Fase 4 (Carrinho, Checkout e Pagamentos).

### Fase 3 - Itens implementados (2026-05-27)
- Schema Prisma expandido com 6 novos models + 3 enums
- Migration incremental: `20260527000000_fase3_catalogo`
- 6 novos providers: Category, Product, ProductVariant, ProductMedia, Banner, PublicCache
- 4 modulos completos: categories, products, banners, media
- 16+ arquivos de modulo (schemas, services, controllers, routes)
- 10 endpoints admin + 5 endpoints publicos
- Cache Redis publico com invalidacao
- Build limpo, 94 testes passando

### Fase 3 - O que falta para Fase 4
- Schema Prisma: Cart, CartItem, Coupon, CouponUsage, Address, ShippingMethod, ShippingRule, Order, OrderItem, OrderAddress, OrderStatusHistory, PaymentAttempt, PaymentStatusTransition, PaymentWebhookEvent, Favorite
- Modulos: carrinho, checkout, frete, cupom, pagamento, pedidos
- Integracao Mercado Pago (checkout embedded + webhooks)

## Regras de implementacao
- sem `any`
- sem mocks tecnicos em fluxo real
- sem segredo hardcoded
- sem stack trace exposto em resposta
- sem tokens, hashes ou secrets em logs
- toda validacao de seguranca no backend
- sem caminhos relativos profundos
- usar alias
- controller -> service/use-case -> repository/provider -> database
- DTO nao e schema
- schema valida entrada

## Como continuar a implementacao
Executar em pequenos passos:

1. confirmar a fase corrente e o escopo exato
2. ler os arquivos canônicos relevantes
3. explicar rapidamente o que sera alterado antes de editar
4. editar o codigo
5. compilar
6. testar
7. registrar claramente o que foi feito, o que falta e como validar

## Comandos uteis
Na raiz do repositório:

```bash
npm install
npm run prisma:generate
npm run build
npm run test
```

Com PostgreSQL e Redis reais configurados:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Variáveis de ambiente mínimas
Ver `apps/api/.env.example`.

Minimas para a fundacao atual:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `REFRESH_TOKEN_SECRET`
- `TWO_FA_ENCRYPTION_KEY`

Opcionais:
- `SENTRY_DSN` - habilita Sentry error tracking
- `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` - seed de admin inicial

## Checklist para o proximo agente
- Fase 3 esta IMPLEMENTADA - avancar para Fase 4 (Carrinho, Checkout e Pagamentos)
- ler `04-fase-carrinho-checkout-e-pagamentos/` antes de qualquer alteracao
- nao alterar contratos canonicos sem instrução explicita
- nao relaxar seguranca para facilitar teste
- manter refresh token apenas em cookie
- manter `RS256`
- manter RBAC fora do JWT
- manter reuse detection com revogacao total
- manter `traceId` em toda resposta
- manter logs seguros
- prioridade 1: aplicar migrations contra PostgreSQL real (`npx prisma migrate deploy`)
- prioridade 2: expandir schema Prisma para Fase 4 (Cart, Order, Payment, Coupon, Shipping, Address)
- prioridade 3: implementar modulo de carrinho (guest cart + merge ao logar)
- prioridade 4: implementar modulo de checkout e pagamento (Mercado Pago)
