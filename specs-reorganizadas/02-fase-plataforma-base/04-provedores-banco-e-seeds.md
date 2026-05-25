# Fase 2 - Provedores, Banco e Seeds

## Objetivo
Definir o que precisa existir como infraestrutura compartilhada antes dos modulos de negocio.

## Provedores obrigatorios
- `IUserProvider`
- `ISessionProvider`
- `ITokenProvider`
- `IAuditProvider`
- `ITraceProvider`
- `ISseProvider`
- `IQueueProvider`
- `IStorageProvider`
- `IEmailProvider`
- `IPaymentProvider` ou interface equivalente para gateway de pagamento
- `IShippingProvider` ou interface equivalente para frete

## Banco base
Tabelas base obrigatorias:
- `users`
- `roles`
- `permissions`
- `sessions`
- `audit_events`
- `email_verification_tokens`
- `password_reset_tokens`

## Seeds base
- role inicial de cliente
- roles administrativas
- permissoes iniciais
- tecidos iniciais
- tamanhos iniciais
- cores iniciais
- admin bootstrap

## Regra sobre modelagem
- snapshots de pedido nao podem depender do produto vivo
- tabelas transacionais devem usar constraints, indices e integridade real
- dados temporarios vao para Redis, nao para Postgres por conveniencia

## Checklist
- [ ] contratos de provider definidos
- [ ] schema base definido
- [ ] seeds obrigatorias listadas
- [ ] estrategia de integridade definida
