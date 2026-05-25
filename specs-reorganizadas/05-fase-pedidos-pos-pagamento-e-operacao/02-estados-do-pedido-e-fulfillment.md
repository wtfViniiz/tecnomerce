# Fase 5 - Estados do Pedido e Fulfillment

## Estado macro do pedido
- `PENDING`
- `PAID`
- `IN_PRODUCTION`
- `PRINTING`
- `FINISHING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`

## Regras
- toda transicao precisa ser validada
- toda transicao precisa gerar historico
- pedido salva snapshots de produto, tecido, cor, tamanho, preco e personalizacao
- alteracoes futuras do catalogo nao podem alterar o passado

## Operacao
- separar estado de pagamento do estado logistico
- permitir timeline interna no admin
- registrar tracking code e eventos de envio
