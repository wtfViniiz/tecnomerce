# Fase 1 - Padrao Backend Obrigatorio

## Regra
Este arquivo define o padrao obrigatorio de implementacao do backend. A LLM nao deve alterar arquitetura de modulo, camadas, naming ou fluxo entre controller e banco.

## Arquitetura obrigatoria
```txt
controller
-> service/use-case
-> repository/provider
-> database
```

## Estrutura obrigatoria por modulo
```txt
modules/
  auth/
    controllers/
    services/
    repositories/
    providers/
    dto/
    schemas/
    middleware/
    routes/
    tests/
    index.ts
```

## Regras de modelagem de codigo
- DTO nao e schema
- schema valida entrada
- dto trafega dados
- mapper converte dominio

## Classes vs funcoes
- Stateless: funcoes
- Provider: classes
- Middleware: funcoes
- Use-cases: classes pequenas
- Utils: funcoes puras

## Erros tipados
Hierarquia obrigatoria:

```txt
BaseAppError
├── AuthError
├── ValidationError
├── RbacError
├── RateLimitError
└── InternalServerError
```

## Endpoints
Padrao obrigatorio:
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `POST /api/v1/cart/items`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

## Envelope obrigatorio
```json
{
  "status": "success",
  "data": {},
  "error": null,
  "traceId": "uuid"
}
```

## Jobs e filas
- BullMQ + Redis obrigatorios
- filas obrigatorias:

```txt
queues/
  email
  audit
  image-processing
  order-events
  payment-webhooks
  sse-broadcast
```

## Mapeamento minimo de eventos para jobs
- pagamento aprovado -> atualizar pedido
- novo pedido -> emitir SSE
- login -> auditoria
- upload imagem -> compressao/processamento
