# Especificacao Reorganizada do E-commerce

## Objetivo desta pasta
Esta pasta reorganiza a documentacao existente em uma sequencia executavel, com fases numeradas, dependencias claras, correcoes de logica e entregaveis verificaveis.

## Como usar
1. Ler `01-fase-inicializacao/` inteira, com prioridade para `00-stack-obrigatorio.md`.
2. Aprovar as decisoes canonicas em `01-fase-inicializacao/02-decisoes-canonicas.md`.
3. Executar as fases na ordem numerada.
4. So iniciar uma fase quando a checklist da fase anterior estiver fechada.

## Ordem das fases
1. `01-fase-inicializacao/`
   Base de contexto, escopo, decisoes canonicamente aceitas e pre-requisitos.
2. `02-fase-plataforma-base/`
   Fundacao tecnica: auth, sessoes, RBAC, provedores, API, banco, observabilidade.
3. `03-fase-catalogo-e-conteudo/`
   Catalogo, tecidos, imagens, banners e publicacao.
4. `04-fase-carrinho-checkout-e-pagamentos/`
   Carrinho, checkout, frete, Mercado Pago, webhooks e confirmacao.
5. `05-fase-pedidos-pos-pagamento-e-operacao/`
   Pedidos, timeline, fulfillment, rastreio, auditoria operacional.
6. `06-fase-admin-e-operacao-interna/`
   Painel administrativo, modulos operacionais, controles e seguranca.
7. `07-fase-infra-qualidade-e-go-live/`
   Deploy, observabilidade, testes, seguranca final e readiness de producao.

## Documentos de apoio
- `99-anexos/01-mapa-de-origem.md`
- `99-anexos/02-lacunas-que-ainda-exigem-validacao.md`

## Regra central
Nada nesta pasta autoriza mock, `any`, placeholder sem dono, integracao inventada ou fluxo sem fonte real. Onde a documentacao original era ambigua, a decisao foi explicitada.

## Regra de interpretacao
Se dois arquivos parecerem abrir margem de escolha, prevalece o texto mais restritivo e mais especifico. A LLM nao deve decidir arquitetura, seguranca, padrao de resposta, padrao de rota ou fluxo critico fora do que esta fixado nesta pasta.

## Prioridade interna da fase 1
1. `00-stack-obrigatorio.md`
2. `02-decisoes-canonicas.md`
3. `03-correcoes-logicas-e-ambiguidade.md`
4. `04-pre-requisitos-de-ambiente-e-repositorio.md`
5. `01-escopo-e-resultado-esperado.md`
6. `05-glossario-e-regras-transversais.md`
7. `06-seguranca-obrigatoria.md`
8. `07-padrao-frontend-obrigatorio.md`
9. `08-padrao-backend-obrigatorio.md`
10. `09-schema-ecommerce-detalhado.md`
11. `10-fluxos-de-tela-e-navegacao.md`
12. `11-principios-canonicos-do-dominio.md`
13. `12-schema-canonico-completo.md`
