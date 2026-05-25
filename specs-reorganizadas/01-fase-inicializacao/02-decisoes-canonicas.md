# Fase 1 - Decisoes Canonicas

## Objetivo
Resolver contradicoes entre os documentos originais e fixar uma base unica para o restante da execucao.

## Decisoes canonicas aceitas

### 1. Arquitetura geral
- O projeto sera um **monolito modular dentro de um monorepo**.
- `apps/web` atende a loja.
- `apps/admin` atende o painel.
- `apps/api` atende API, auth, pagamentos, webhooks e jobs expostos.
- `worker` roda separado em deploy, mas continua pertencendo ao mesmo sistema.

### 2. Estrategia de API
- Prefixo canonico: `/api/v1`.
- Rotas administrativas ficam sob `/api/v1/admin/*`.
- Rotas publicas e autenticadas de cliente ficam sob `/api/v1/*`.
- O painel web continua em `/admin`.

### 3. Envelope de resposta
- O formato canonico sera:

```json
{
  "status": "success",
  "data": {},
  "error": null,
  "traceId": "uuid"
}
```

- Em erro:

```json
{
  "status": "error",
  "data": null,
  "error": {
    "code": "STRING",
    "message": "STRING",
    "details": {}
  },
  "traceId": "uuid"
}
```

### 4. Autenticacao e sessoes
- Access token: JWT curto, 15 min.
- Algoritmo canonico: `RS256`.
- Refresh token: opaco, alta entropia, cookie `HttpOnly Secure SameSite=Strict`.
- Rotacao de refresh obrigatoria.
- Reuse detection obrigatorio.
- Atualizacao de refresh/session chain obrigatoriamente transacional.

### 5. Hashing e segredos
- Senhas: `Argon2id`.
- Refresh token: hash `Argon2id`.
- Backup codes de 2FA: hash `Argon2id`.
- Segredos sensiveis criptografados com `AES-256-GCM`.
- `bcrypt` deixa de ser referencia canonica; aparece em docs antigos e fica obsoleto.

### 6. RBAC
- O sistema usara RBAC real com `User`, `Role`, `Permission`.
- Nao sera limitado a um unico enum de role no JWT.
- O JWT deve carregar apenas claims minimos de sessao e identidade.
- As permissoes efetivas devem viver fora dele.
- Cache de permissoes por sessao em Redis.

### 7. 2FA admin
- 2FA TOTP obrigatorio para contas admin.
- Verificacao de 2FA ocorre antes da sessao final estar ativa.
- Operacoes sensiveis devem exigir step-up auth.

### 8. Real-time
- SSE e o mecanismo obrigatorio de atualizacoes em tempo real do admin e status operacionais.
- WebSocket nao faz parte do padrao inicial desta especificacao.

### 9. Banco e identidade
- Banco principal: PostgreSQL.
- ORM: Prisma.
- IDs canonicos: `cuid()` no nivel Prisma.
- UTC em persistencia.

### 10. E-commerce e estoque
- O primeiro ciclo **nao depende de estoque tradicional**.
- O sistema nasce como catalogo + producao sob demanda + validacoes logicas.
- Qualquer controle de estoque por variante no admin deve ser tratado como apoio operacional e nao como fonte obrigatoria para autorizar compra no primeiro ciclo.

### 11. Pagamentos
- Checkout precisa ser embedded.
- Fonte autoritativa do estado de pagamento: webhook + validacao server-side.
- Frontend jamais aprova pedido por conta propria.
- Valores sempre calculados no backend.

### 12. Storage e uploads
- Sem armazenamento local persistente.
- Upload via URL pre-assinada para AWS S3.
- Arquivos sensiveis ou privados com acesso temporario.

### 13. Logs, auditoria e tracing
- `traceId` obrigatorio.
- Logs estruturados em JSON.
- Eventos criticos de auth, admin, pedidos e pagamento precisam gerar auditoria.

## Decisoes que invalidam partes dos docs antigos
- `HS256` nao e mais padrao canonico.
- `bcrypt` nao e mais padrao canonico.
- `role` simples como unica fonte de autorizacao nao e suficiente.
- placeholder de SSE em spec antiga deixa de existir; SSE passa a ser parte definida.
