# Fase 7 - Deploy, Testes e Readiness

## Infra minima
- app
- worker
- postgres
- redis
- nginx

## Regras de deploy
- CI obrigatoria
- lint
- typecheck
- testes
- build
- docker build
- rollback viavel

## Testes obrigatorios
- unitarios
- integracao
- auth flow
- permission flow
- webhook flow
- idempotencia de pagamento
- PIX flow
- falhas e retries

## Observabilidade obrigatoria
- logs estruturados centralizados
- metricas Prometheus
- dashboards Grafana
- Sentry frontend/backend
- health endpoints

## Checklist de producao
- [ ] HTTPS obrigatorio
- [ ] CORS restritivo
- [ ] rate limiting ativo
- [ ] 2FA admin ativo
- [ ] auditoria ativa
- [ ] backups configurados
- [ ] webhook validado
- [ ] pagamentos testados em sandbox
- [ ] staging aprovado
