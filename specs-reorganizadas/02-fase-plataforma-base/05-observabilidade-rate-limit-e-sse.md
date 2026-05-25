# Fase 2 - Observabilidade, Rate Limit e SSE

## Objetivo
Garantir que a plataforma nasca depuravel, monitoravel e protegida contra abuso.

## Observabilidade obrigatoria
- `traceId` por request
- logs JSON com `traceId`, `requestId`, `userId`, `module`
- metricas de auth, RBAC, pagamento, filas e webhooks
- health checks para DB, Redis, storage e servicos externos criticos
- Sentry para frontend e backend
- Prometheus para metricas
- Grafana para dashboards

## Rate limit obrigatorio
- login: 5/min por IP
- refresh: 10/min por contexto seguro
- register: 3/min
- checkout: 5 tentativas/10 min
- admin APIs: 60/min
- search guest: 20/min
- search auth: 60/min

## SSE
- autenticacao por cookie/sessao para browser
- autorizacao por stream
- heartbeat
- limite de conexoes por usuario
- estrategia de reconnect
- estado compartilhado para escala horizontal

## Checklist
- [ ] tracing definido
- [ ] logging definido
- [ ] metricas minimas definidas
- [ ] rate limit por contexto definido
- [ ] SSE autenticado definido
