# Fase 1 - Escopo Minimo do Schema

## Regra
Este arquivo nao define o schema final. Ele existe apenas para registrar o escopo minimo de dominio que o schema obrigatoriamente deve cobrir.

## Fonte canonica
- O schema final deve ser derivado de `11-principios-canonicos-do-dominio.md`.
- Se houver conflito, os principios de dominio prevalecem.

## Entidades minimas obrigatorias no schema futuro

### Catalogo
- Product
- ProductVariant
- Category
- Fabric
- ProductMedia

### Carrinho
- Cart
- CartItem

### Pedido
- Order
- OrderItem
- OrderAddress
- OrderStatusHistory

### Pagamento
- PaymentAttempt
- PaymentWebhookEvent
- PaymentStatusTransition

### Cupom
- Coupon
- CouponUsage

### Frete
- ShippingMethod
- ShippingRule
