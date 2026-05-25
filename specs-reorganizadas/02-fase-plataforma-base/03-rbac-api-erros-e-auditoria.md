# Fase 2 - RBAC, API, Erros e Auditoria

## Objetivo
Fixar os contratos de autorizacao, respostas e observabilidade de aplicacao.

## RBAC
- entidades: `User`, `Role`, `Permission`
- permissoes no formato `resource:action`
- cache de permissoes efetivas em Redis por `sessionId`
- invalidacao imediata em mudanca de role ou permission

## Middleware obrigatorio
- `authenticate`
- `requirePermission`
- `admin2faRequired`
- `validateRequest`
- `traceMiddleware`
- `rateLimit`

## Regras obrigatorias de API
- o backend deve validar tudo que chega do client
- o backend nao deve confiar em role, permission ou ownership informados pelo client
- o backend nao deve retornar hash, token interno, segredo, stack trace ou detalhe sensivel em erro
- o backend deve sanitizar logs e respostas

## Taxonomia de erro
- `AUTH.*`
- `VALIDATION.*`
- `RESOURCE.*`
- `REQUEST.*`
- `RATE_LIMIT.*`
- `EXTERNAL.*`
- `SERVER.*`
- `PAYMENT.*`
- `ORDER.*`
- `CHECKOUT.*`

## Envelope de erro
- sempre incluir `traceId`
- nunca retornar stack trace
- detalhes somente quando forem seguros

## Auditoria obrigatoria
- login sucesso/falha
- refresh
- reuse detectado
- 2FA enroll/verify/failure
- alteracao de role
- acesso admin
- criacao/atualizacao/delecao de produto
- criacao de pedido
- pagamento aprovado/rejeitado
- refund

## Checklist
- [ ] RBAC definido
- [ ] middleware definido
- [ ] envelope de sucesso e erro definido
- [ ] eventos de auditoria definidos
