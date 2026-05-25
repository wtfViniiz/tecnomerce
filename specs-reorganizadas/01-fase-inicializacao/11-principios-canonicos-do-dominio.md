# Fase 1 - Principios Canonicos do Dominio

## Regra
Este documento governa o schema do e-commerce. O schema final deve ser derivado destas decisoes e nao o contrario. A LLM nao deve modelar entidades, relacoes ou tabelas em desacordo com estes principios.

## 1. Estrategia de produto

### Modelo canonico
- O sistema deve usar **produto base + variantes vendaveis**.
- `Product` representa a identidade comercial, editorial e navegacional do item.
- `ProductVariant` representa a unidade vendavel usada em carrinho, checkout, pedido, preco e estoque.

### Tamanho e cor
- Tamanho e cor devem ser tratados como atributos de variante.
- O schema nao deve gravar tamanho e cor apenas como metadata solta do item.

### Tecido
- Tecido deve ser tratado como atributo de variante quando alterar a unidade vendavel.
- Se o produto tiver apenas um tecido possivel, esse tecido ainda deve permanecer modelado de forma relacional e nao embutido em texto livre.

### Personalizacao
- Personalizacao deve ser modelada como estrutura propria do dominio e nao como blob generico sem contrato.
- O pedido deve persistir personalizacao resolvida em snapshot imutavel por item.
- O carrinho pode usar estrutura transitória validada, mas o pedido deve congelar os campos finais.

### SKU strategy
- Toda variante vendavel deve possuir SKU proprio.
- SKU deve ser unico globalmente.
- SKU deve ser imutavel depois da publicacao, salvo operacao administrativa controlada e auditada.

### Slug strategy
- `Product.slug` deve ser unico globalmente.
- O slug deve ser derivado do nome, normalizado e estabilizado.
- Mudanca de slug deve ser excepcional, auditada e preparada para redirect.

### Versionamento de produto
- O produto nao deve usar versionamento hard por tabela paralela no primeiro ciclo.
- O historico comercial deve ser preservado por snapshots em `OrderItem`.
- Alteracoes administrativas devem ser auditadas.

### Soft delete vs archive
- Produto nao deve ser apagado fisicamente no fluxo normal.
- O padrao canonico e `archive` operacional + `soft delete` tecnico quando aplicavel.
- Produto arquivado sai do catalogo publico, mas permanece referenciavel por pedidos historicos.

## 2. Estrategia de estoque

### Estado inicial
- O primeiro ciclo nao depende de estoque tradicional para existir.
- O dominio comercial nasce como catalogo + producao sob demanda.

### Controle operacional
- O sistema deve suportar controle de disponibilidade por variante.
- Esse controle deve existir como capacidade do dominio, mesmo que a regra inicial seja producao sob demanda.

### Reserva
- O primeiro ciclo nao deve implementar reserva dura de estoque em checkout como requisito central.
- O carrinho nao bloqueia estoque.
- Eventual reserva operacional futura deve ser feita por variante e com TTL.

### Decremento
- Se houver contagem de disponibilidade real em variante, o decremento definitivo deve ocorrer apenas apos confirmacao de pagamento.
- Criacao de pedido sem pagamento aprovado nao deve consumir disponibilidade definitiva.

## 3. Estrategia de preco

### Fonte de verdade
- Todo preco final deve ser calculado no backend.

### Modelo canonico
- O sistema deve suportar:
  - preco base por variante
  - preco promocional por variante
  - acrescimo por personalizacao

### Historico
- O pedido deve congelar preco final por item em snapshot.
- O primeiro ciclo nao precisa de tabela de historico analitico de preco para catalogo, desde que o snapshot do pedido seja completo.

### Multicurrency
- O primeiro ciclo deve operar com moeda unica.
- O schema deve ser preparado para multicurrency futura sem assumir multicurrency agora.
- Todos os valores monetarios devem ser persistidos em centavos/unidade inteira.

## 4. Estrategia de midia

### Modelo canonico
- Produto deve suportar multiplas imagens.
- A midia deve possuir ordenacao explicita.
- Deve existir imagem principal por contexto de uso.

### Regras
- Imagens nao devem viver como array opaco dentro de `Product`.
- Midia deve ser entidade relacional propria.
- O sistema deve gerar ativos otimizados e responsivos.
- A entrega deve ocorrer via CDN.

## 5. Estrategia de carrinho

### Guest cart
- O sistema deve suportar guest cart.

### Merge ao logar
- Ao autenticar, o carrinho guest deve ser conciliado com o carrinho do usuario.
- A regra canonica e merge deterministico com consolidacao por variante + configuracao de personalizacao equivalente.

### Persistencia
- Carrinho deve ser persistido server-side.
- Carrinho nao deve depender apenas de estado local do navegador.

### TTL
- Guest cart deve possuir TTL.
- Carrinho autenticado pode ter TTL estendido, mas nao deve ser eterno sem politica de limpeza.

### Snapshot
- O pedido deve ser derivado de snapshot do carrinho validado no momento do checkout.
- O pedido nao deve depender de leituras futuras do carrinho.

## 6. Estrategia de pedido

### Snapshot
- O pedido deve congelar integralmente os itens comprados.
- Cada `OrderItem` deve persistir nome, SKU, variante, preco, personalizacao e atributos resolvidos.

### Endereco
- Endereco do pedido deve ser imutavel depois da criacao do pedido, salvo fluxo administrativo auditado antes do envio.

### Preco
- O pedido deve congelar subtotal, desconto, frete e total final.
- O sistema nao deve recalcular historicamente um pedido antigo com base no catalogo atual.

### Lifecycle oficial
- Estado canonico do pedido:
  - `PENDING`
  - `WAITING_PAYMENT`
  - `PAID`
  - `PROCESSING`
  - `SHIPPED`
  - `DELIVERED`
  - `CANCELLED`
  - `REFUNDED`
  - `PAYMENT_FAILED`

### Cancelamento
- Cancelamento deve ser transicao formal de estado e sempre auditado.

### Refund parcial futuro
- O schema deve nascer preparado para refund parcial futuro.
- O primeiro ciclo nao precisa expor refund parcial como fluxo funcional obrigatorio.

## 7. Estrategia de pagamento

### Tentativa de pagamento
- O sistema deve modelar tentativa de pagamento como entidade propria.
- Pedido e pagamento nao devem ser a mesma entidade.

### Idempotencia
- Toda criacao de pagamento deve usar chave de idempotencia.

### Multiplos pagamentos por pedido
- O schema deve permitir multiplas tentativas de pagamento por pedido.
- O pedido deve ter no maximo um pagamento efetivamente aprovado como fonte comercial final no primeiro ciclo.

### Split futuro
- O primeiro ciclo nao suporta split de pagamento.
- O schema nao deve se acoplar de forma que torne split impossivel no futuro.

### Reconciliacao
- Webhook deve ser a fonte autoritativa de mudanca de estado.
- O sistema deve persistir eventos de webhook e transicoes de pagamento separadamente.

## 8. Estrategia de frete

### Estado inicial
- O primeiro ciclo deve usar logica de frete por CEP e regras internas.

### Metodos
- O sistema deve suportar multiplos metodos de frete desde o schema inicial.

### Tabela fixa
- O primeiro ciclo deve suportar tabela fixa/regra interna como fonte principal.

### Calculo externo futuro
- O dominio deve permitir provider externo futuro sem reescrever pedido ou checkout.

## 9. Estrategia de cupom

### Tipos
- O sistema deve suportar cupom percentual e cupom fixo.

### Limites
- Deve suportar:
  - limite global de uso
  - limite por usuario
  - validade temporal
  - valor minimo de pedido

### Stackable
- O padrao canonico inicial e **cupom nao cumulativo**.
- O primeiro ciclo nao deve aceitar stacking de cupons.

## 10. Estrategia de auditoria

### Entidades com historico obrigatorio
- auth
- roles e permissions
- products
- variants
- coupons
- orders
- payments
- banners
- configuracoes administrativas

### Actor tracking
- Toda mutacao administrativa deve registrar ator.
- Toda transicao critica de pedido e pagamento deve registrar ator ou origem sistemica.

### Soft delete
- Soft delete deve existir nas entidades administrativas e de catalogo onde o apagamento fisico quebraria historico.

## 11. Estrategia de realtime/SSE

### Escopo real
- Realtime deve existir apenas onde agrega operacao ou UX critica.

### Eventos obrigatorios
- status de pedido para admin
- novo pedido para admin
- eventos criticos de pagamento para admin
- alertas operacionais para admin
- atualizacao de sessao/notificacao do usuario quando houver caso funcional real

### Granularidade
- Os canais devem ser separados por escopo:
  - user
  - admin
  - system

### Replay
- O primeiro ciclo nao exige replay completo de eventos SSE.
- O sistema deve suportar re-sincronizacao por refetch.

### Persistencia
- Evento SSE nao e fonte de verdade.
- Persistencia obrigatoria existe na entidade de dominio ou em auditoria, nao no canal SSE.

## 12. Estrategia administrativa

### Approval flows
- O primeiro ciclo nao exige approval flow formal para CRUD comum.
- Acoes sensiveis devem exigir permissao adequada, auditoria e step-up auth.

### Draft/published
- Conteudos editoriais e comerciais devem suportar `draft` e `published` quando houver impacto publico.
- Produto nao deve depender apenas de booleano `active` se houver fluxo editorial.

### Permissoes
- Permissoes devem ser por recurso e acao.

### Concorrencia
- O sistema deve nascer preparado para concorrencia multi-admin.
- Atualizacoes sensiveis devem prever controle de conflito otimista ou estrategia equivalente.

## 13. Estrategia de busca

### Estado inicial
- O primeiro ciclo deve usar busca em PostgreSQL.

### Filtros oficiais
- Catalogo deve suportar filtros oficiais por:
  - categoria
  - tecido
  - cor
  - tamanho
  - faixa de preco
  - personalizavel

### Indexacao externa futura
- O schema nao deve acoplar busca a provider externo no primeiro ciclo.
- Integracao futura com indexador externo deve ser possivel por eventos ou jobs.

## 14. Estrategia de extensibilidade

### Deve nascer desacoplado
- auth
- payments
- shipping
- storage
- queue
- realtime

### Pode ser simplificado agora
- multicurrency
- split payment
- approval workflow complexo
- replay persistente de SSE
- motor de busca externo

### Deve ser future-proof
- produto e variante
- pedido e snapshots
- tentativa de pagamento
- cupons e usos
- enderecos de pedido
- midia
- auditoria

## Regra final
- O schema final deve refletir estes principios de forma direta.
- Nenhuma entidade deve ser criada apenas por conveniencia tecnica se ela contradizer a regra de dominio definida aqui.
