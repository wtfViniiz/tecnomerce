# Anexo - Lacunas que Ainda Exigem Validacao

## Itens que continuam dependentes de validacao externa ou decisao futura

### 1. Mercado Pago
- versao exata do SDK
- versao exata da API
- payload final dos eventos usados
- politica final de assinatura de webhook

### 2. Frete
- provedor real de frete do primeiro ciclo
- modelo final de tabela de zonas/faixas

### 3. Storage
- escolha final entre S3 e R2
- estrategia de nomes publicos vs privados por bucket/path

### 4. RLS
- escopo exato de tabelas que terao RLS no Postgres desde a primeira entrega

### 5. Realtime
- quais eventos do admin entram em SSE na primeira versao

## Regra
Essas lacunas nao bloqueiam a reorganizacao da especificacao.
Elas apenas nao devem ser tratadas como "resolvidas" na implementacao sem validacao adicional.
