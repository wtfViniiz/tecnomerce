# Fase 3 - Modelagem Comercial

## Produto
Campos minimos:
- id
- slug
- name
- description
- categoryId
- basePrice
- customizable
- couponEligible
- productionTimeDays
- isActive

## Entidades associadas
- `categories`
- `fabrics`
- `sizes`
- `colors`
- `product_images`
- `product_variants` ou composicao equivalente

## Regra importante
O catalogo nao depende de estoque tradicional para existir.

## Personalizacao
Suportar:
- nome personalizado
- numero personalizado
- observacoes
- custo adicional
- prazo adicional

## Midia
- multiplas imagens por produto
- ordem manual
- thumbnail
- hover image
- versoes otimizadas
