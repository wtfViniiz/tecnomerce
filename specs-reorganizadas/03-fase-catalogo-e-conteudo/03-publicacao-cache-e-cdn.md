# Fase 3 - Publicacao, Cache e CDN

## Objetivo
Preparar o catalogo para alto volume de leitura.

## Estrategia
- homepage: ISR curto
- categorias: ISR medio
- produto: ISR curto
- checkout/cart/account/admin: dinamico e `no-store`

## Cache
- browser cache para assets versionados
- CDN para assets e paginas publicas cacheaveis
- Redis para produto, categoria, filtros e sugestoes

## Invalidacao
- update de produto invalida produto, categoria, busca e colecoes relacionadas
- update de preco invalida imediatamente
- conteudo de hero/banner invalida homepage e campanhas impactadas
