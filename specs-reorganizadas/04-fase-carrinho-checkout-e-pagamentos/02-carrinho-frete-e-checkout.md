# Fase 4 - Carrinho, Frete e Checkout

## Carrinho
- deve suportar modo anonimo e autenticado
- precisa suportar itens com personalizacao
- backend recalcula tudo antes do checkout

## Backend recalcula
- preco base
- acrescimo por personalizacao
- desconto por cupom
- frete
- total final

## Regra de seguranca
- nenhum valor financeiro vindo do client deve ser tratado como fonte de verdade
- toda validacao de checkout deve ser refeita no backend antes da criacao do pedido

## Frete
- modulo proprio
- regras por CEP/faixa/zona
- free shipping rules
- integracao externa preparada, sem tornar a compra dependente de gambiarra

## Cupom
Validar no backend:
- expiracao
- limite de uso
- elegibilidade
- minimo do pedido
- aplicabilidade por categoria/produto
