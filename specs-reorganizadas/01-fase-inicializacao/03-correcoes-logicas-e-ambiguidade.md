# Fase 1 - Padrao Fechado sem Ambiguidade

## Regra deste documento
Este arquivo nao apresenta alternativas para a implementacao. Ele fixa o padrao final que deve ser seguido.

## 1. Estrutura do repositorio e da aplicacao
- O repositorio deve usar estrutura de monorepo.
- O backend deve ser implementado como monolito modular.
- A estrutura raiz obrigatoria e:

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

## 2. Autenticacao e autorizacao
- O sistema deve usar `RS256` para access token.
- O sistema deve usar `Argon2id` para senha, refresh token e backup code.
- O sistema deve implementar refresh rotation com reuse detection.
- O sistema deve usar RBAC completo com `User`, `Role` e `Permission`.
- O sistema nao deve usar enum simples de role como unica fonte de autorizacao.

## 3. Padrao de rotas
- Todo endpoint HTTP deve usar prefixo `/api/v1`.
- Toda rota administrativa deve usar prefixo `/api/v1/admin/*`.
- O sistema nao deve usar `/api/admin/*` fora do versionamento.

## 4. Padrao de resposta
- Toda resposta deve usar um unico envelope com `status`, `data`, `error` e `traceId`.
- O sistema nao deve usar formatos alternativos de envelope.

## 5. Modelo comercial inicial
- O primeiro ciclo deve operar com producao sob demanda.
- O primeiro ciclo nao deve depender de estoque tradicional para validar compra.
- O backend deve usar disponibilidade logica, prazo de producao e regras operacionais.
- Se existir controle de inventario interno, ele nao substitui essa regra.

## 6. Real-time
- O sistema deve usar SSE como mecanismo padrao de atualizacao em tempo real.
- O sistema nao deve usar WebSocket como padrao inicial.

## 7. Seguranca de dados
- Ownership e autorizacao devem ser validados no backend em todas as rotas sensiveis.
- RLS de Postgres deve ser tratado como hardening adicional e nao como substituto da autorizacao da aplicacao.

## 8. Mock, preview e ativos visuais
- O sistema nao deve usar mock tecnico, mock de integracao ou fluxo fake.
- O termo "mockup" so pode ser usado para arte, preview ou composicao visual real do produto.

## 9. Pagamentos
- A arquitetura de pagamento deve ser definida desde ja para checkout embedded.
- A implementacao real de Mercado Pago so pode avancar apos confirmacao de SDK, API e assinatura oficiais.

## 10. Seguranca administrativa
- Toda conta administrativa deve usar 2FA obrigatorio.
- O sistema nao deve tratar 2FA admin como opcional.
