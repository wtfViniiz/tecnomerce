# Fase 1 - Fluxos de Tela e Navegacao

## Fluxo obrigatorio da loja
```txt
Home
-> Catalogo
-> Produto
-> Personalizacao
-> Carrinho
-> Checkout
-> Pagamento
-> Sucesso
```

## Paginas obrigatorias da loja
- Home
- Catalogo
- Produto
- Tecidos
- Personalizacao
- Carrinho
- Checkout
- Login
- Cadastro
- Conta
- Pedidos
- Favoritos
- Sobre
- Contato
- Politica
- Cookies

## Paginas obrigatorias do admin
- Dashboard
- Produtos
- Pedidos
- Cupons
- Banners
- Usuarios
- Permissoes
- Analytics
- Configuracoes

## Fluxo obrigatorio de checkout
```txt
cart
-> address
-> shipping
-> payment
-> confirmation
```

## Fluxo obrigatorio do admin
- Produtos:
  - listar
  - criar
  - editar
  - ativar/desativar
- Pedidos:
  - listar
  - visualizar
  - atualizar status
  - rastreio

## Permissoes minimas por area admin
- dashboard -> `admin:access`
- produtos -> `product:*`
- pedidos -> `order:*`
- analytics -> `analytics:read`
