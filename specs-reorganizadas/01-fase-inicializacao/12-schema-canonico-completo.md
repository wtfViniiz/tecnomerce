# Fase 1 - Schema Canonico Completo

## Regra
Este documento define o schema canonico do dominio do e-commerce. Ele deve ser implementado como consequencia direta de `11-principios-canonicos-do-dominio.md`. A LLM nao deve inventar entidades paralelas, colapsar entidades distintas nem simplificar relacoes que aqui foram definidas como obrigatorias.

## Convencoes globais

### Identidade
- Toda entidade principal deve usar `id` string com `cuid()`.
- Chaves externas devem referenciar `id` da entidade alvo.

### Datas
- Toda data persistida deve estar em UTC.
- Entidades principais devem ter `createdAt` e `updatedAt`.

### Auditoria base
- Entidades administrativas e comerciais mutaveis devem carregar:
  - `createdByUserId` opcional
  - `updatedByUserId` opcional
- O historico detalhado de mutacoes deve existir em auditoria separada e nao apenas nesses campos.

### Soft delete strategy
- Catalogo e entidades administrativas mutaveis devem usar `deletedAt`.
- Entidades historicas e transacionais imutaveis nao devem usar soft delete como fluxo normal.
- `Order`, `OrderItem`, `PaymentAttempt`, `PaymentWebhookEvent`, `OrderStatusHistory` e `PaymentStatusTransition` nao devem ser apagados nem ocultados por soft delete.

### Valores monetarios
- Todo valor monetario deve ser inteiro em centavos.
- Toda entidade monetaria deve carregar `currencyCode`.
- O primeiro ciclo usa uma unica moeda, mas o schema deve manter `currencyCode`.

## Enums canonicos

### UserType
- `CUSTOMER`
- `ADMIN`
- `SYSTEM`

### ProductStatus
- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

### MediaType
- `IMAGE`

### CartStatus
- `ACTIVE`
- `MERGED`
- `CONVERTED`
- `EXPIRED`
- `ABANDONED`

### OrderStatus
- `PENDING`
- `WAITING_PAYMENT`
- `PAID`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`
- `PAYMENT_FAILED`

### PaymentStatus
- `CREATED`
- `PENDING`
- `PROCESSING`
- `AUTHORIZED`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `REFUNDED`
- `CHARGEDBACK`

### PaymentMethod
- `PIX`
- `CREDIT_CARD`
- `DEBIT_CARD`

### ShippingMethodType
- `STANDARD`
- `EXPRESS`
- `PICKUP`

### CouponType
- `PERCENTAGE`
- `FIXED`

### CouponStatus
- `DRAFT`
- `ACTIVE`
- `INACTIVE`
- `EXPIRED`
- `ARCHIVED`

### AddressType
- `RESIDENTIAL`
- `COMMERCIAL`

### AuditActorType
- `USER`
- `ADMIN`
- `SYSTEM`
- `PROVIDER`

### SseChannelScope
- `USER`
- `ADMIN`
- `SYSTEM`

## Entidades canonicas

### 1. User
Representa conta autenticavel do sistema.

Campos obrigatorios:
- `id`
- `email`
- `name`
- `passwordHash`
- `tokenVersion`
- `isActive`
- `emailVerified`
- `lastLoginAt`
- `twoFaEnabled`
- `twoFaSecret`
- `twoFaBackupHashes`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relacoes:
- 1:N com `Session`
- N:N com `Role`
- 1:N com `Address`
- 1:N com `Cart`
- 1:N com `Order`
- 1:N com `CouponUsage`

Constraints:
- `email` unico global

Indices:
- `email` unique
- `(isActive, emailVerified)`
- `deletedAt`

Ownership:
- usuario dono de seus enderecos, carrinhos e pedidos

### 2. Role
Campos:
- `id`
- `name`
- `description`
- `isSystem`
- `createdAt`
- `updatedAt`

Relacoes:
- N:N com `User`
- N:N com `Permission`
- auto-relacao N:N para hierarquia opcional de roles

Constraints:
- `name` unico

Indices:
- `name` unique
- `isSystem`

### 3. Permission
Campos:
- `id`
- `name`
- `resource`
- `action`
- `description`

Relacoes:
- N:N com `Role`

Constraints:
- `name` unico
- combinacao `(resource, action)` unica

Indices:
- `name` unique
- `(resource, action)` unique

### 4. Session
Campos:
- `id`
- `userId`
- `refreshTokenHash`
- `chainToken`
- `prevChainToken`
- `expiresAt`
- `lastSeenAt`
- `ipAddress`
- `userAgent`
- `deviceName`
- `isRevoked`
- `createdAt`
- `updatedAt`

Relacoes:
- N:1 com `User`

Constraints:
- `refreshTokenHash` unico

Indices:
- `refreshTokenHash` unique
- `userId`
- `expiresAt`
- `isRevoked`
- `lastSeenAt`

### 5. Address
Endereco salvo do usuario para uso em checkout.

Campos:
- `id`
- `userId`
- `label`
- `recipientName`
- `phone`
- `postalCode`
- `street`
- `number`
- `complement`
- `neighborhood`
- `city`
- `state`
- `countryCode`
- `addressType`
- `isDefault`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relacoes:
- N:1 com `User`

Indices:
- `userId`
- `(userId, isDefault)`
- `postalCode`
- `deletedAt`

Ownership:
- pertence ao `User`

### 6. Category
Campos:
- `id`
- `slug`
- `name`
- `description`
- `sortOrder`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- 1:N com `Product`

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `status`
- `sortOrder`
- `deletedAt`

### 7. Fabric
Campos:
- `id`
- `slug`
- `name`
- `description`
- `composition`
- `breathability`
- `weight`
- `advantages`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- 1:N com `ProductVariant`

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `status`
- `deletedAt`

### 8. SizeOption
Campos:
- `id`
- `slug`
- `name`
- `sortOrder`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relacoes:
- 1:N com `ProductVariant`

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `sortOrder`
- `deletedAt`

### 9. ColorOption
Campos:
- `id`
- `slug`
- `name`
- `hexCode`
- `sortOrder`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relacoes:
- 1:N com `ProductVariant`

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `sortOrder`
- `deletedAt`

### 10. Product
Identidade editorial e comercial publica.

Campos:
- `id`
- `slug`
- `name`
- `description`
- `categoryId`
- `status`
- `isCustomizable`
- `couponEligible`
- `productionTimeDays`
- `seoTitle`
- `seoDescription`
- `publishedAt`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- N:1 com `Category`
- 1:N com `ProductVariant`
- 1:N com `ProductMedia`

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `categoryId`
- `status`
- `publishedAt`
- `deletedAt`

### 11. ProductVariant
Unidade vendavel.

Campos:
- `id`
- `productId`
- `sku`
- `fabricId`
- `sizeOptionId`
- `colorOptionId`
- `basePriceCents`
- `promotionalPriceCents`
- `currencyCode`
- `status`
- `isAvailable`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- N:1 com `Product`
- N:1 com `Fabric`
- N:1 com `SizeOption`
- N:1 com `ColorOption`
- 1:N com `CartItem`
- 1:N com `OrderItem`

Constraints:
- `sku` unico global
- combinacao `(productId, fabricId, sizeOptionId, colorOptionId)` unica

Indices:
- `sku` unique
- `productId`
- `fabricId`
- `sizeOptionId`
- `colorOptionId`
- `status`
- `isAvailable`
- `deletedAt`

### 12. ProductMedia
Campos:
- `id`
- `productId`
- `storageKey`
- `cdnUrl`
- `altText`
- `mediaType`
- `position`
- `isPrimary`
- `width`
- `height`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`

Relacoes:
- N:1 com `Product`

Constraints:
- `storageKey` unico

Indices:
- `productId`
- `(productId, position)`
- `(productId, isPrimary)`
- `deletedAt`

Regra:
- deve haver no maximo uma midia primaria ativa por produto

### 13. ProductCustomizationPreset
Define capacidades formais de personalizacao do produto.

Campos:
- `id`
- `productId`
- `allowsCustomName`
- `allowsCustomNumber`
- `allowsNotes`
- `additionalPriceCents`
- `additionalProductionDays`
- `createdAt`
- `updatedAt`

Relacoes:
- 1:1 ou N:1 com `Product`, conforme necessidade futura

Indices:
- `productId`

### 14. Cart
Campos:
- `id`
- `userId`
- `guestTokenHash`
- `status`
- `expiresAt`
- `mergedIntoCartId`
- `createdAt`
- `updatedAt`

Relacoes:
- N:1 opcional com `User`
- 1:N com `CartItem`

Constraints:
- carrinho ativo autenticado: no maximo um por usuario
- guest cart identificado por `guestTokenHash`

Indices:
- `userId`
- `guestTokenHash` unique opcional
- `status`
- `expiresAt`

Ownership:
- pertence ao `User` autenticado ou ao contexto guest

### 15. CartItem
Campos:
- `id`
- `cartId`
- `productVariantId`
- `quantity`
- `unitPriceSnapshotCents`
- `currencyCode`
- `customName`
- `customNumber`
- `customNotes`
- `customizationPriceCents`
- `createdAt`
- `updatedAt`

Relacoes:
- N:1 com `Cart`
- N:1 com `ProductVariant`

Constraints:
- combinacao unica de item equivalente dentro do mesmo carrinho:
  - `(cartId, productVariantId, customName, customNumber, customNotes)`

Indices:
- `cartId`
- `productVariantId`

### 16. Coupon
Campos:
- `id`
- `code`
- `type`
- `valueCentsOrPercentage`
- `currencyCode`
- `status`
- `maxUses`
- `maxUsesPerUser`
- `usedCount`
- `startsAt`
- `expiresAt`
- `minimumOrderAmountCents`
- `isStackable`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- 1:N com `CouponUsage`

Constraints:
- `code` unico case-insensitive
- `isStackable` deve ser `false` no primeiro ciclo

Indices:
- `code` unique
- `status`
- `startsAt`
- `expiresAt`
- `deletedAt`

### 17. CouponUsage
Campos:
- `id`
- `couponId`
- `userId`
- `orderId`
- `usedAt`

Relacoes:
- N:1 com `Coupon`
- N:1 com `User`
- N:1 com `Order`

Constraints:
- um mesmo `orderId` nao deve registrar uso duplicado do mesmo cupom

Indices:
- `couponId`
- `userId`
- `orderId`
- `usedAt`

### 18. ShippingMethod
Campos:
- `id`
- `code`
- `name`
- `type`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relacoes:
- 1:N com `ShippingRule`
- 1:N com `Order`

Constraints:
- `code` unico

Indices:
- `code` unique
- `type`
- `isActive`
- `deletedAt`

### 19. ShippingRule
Campos:
- `id`
- `shippingMethodId`
- `postalCodeStart`
- `postalCodeEnd`
- `priceCents`
- `currencyCode`
- `estimatedMinDays`
- `estimatedMaxDays`
- `minimumOrderAmountCents`
- `isActive`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- N:1 com `ShippingMethod`

Indices:
- `shippingMethodId`
- `(postalCodeStart, postalCodeEnd)`
- `isActive`
- `deletedAt`

### 20. Order
Entidade transacional principal.

Campos:
- `id`
- `userId`
- `status`
- `currencyCode`
- `subtotalCents`
- `discountAmountCents`
- `shippingAmountCents`
- `totalAmountCents`
- `couponId`
- `shippingMethodId`
- `placedAt`
- `cancelledAt`
- `paidAt`
- `createdAt`
- `updatedAt`

Relacoes:
- N:1 com `User`
- N:1 opcional com `Coupon`
- N:1 com `ShippingMethod`
- 1:1 com `OrderAddress`
- 1:N com `OrderItem`
- 1:N com `OrderStatusHistory`
- 1:N com `PaymentAttempt`
- 1:N com `CouponUsage`

Constraints:
- pedido nao deve ser deletado

Indices:
- `userId`
- `status`
- `couponId`
- `shippingMethodId`
- `placedAt`
- `paidAt`

Ownership:
- pertence ao `User`, mas visivel ao admin conforme permissao

### 21. OrderAddress
Snapshot imutavel de endereco do pedido.

Campos:
- `id`
- `orderId`
- `recipientName`
- `phone`
- `postalCode`
- `street`
- `number`
- `complement`
- `neighborhood`
- `city`
- `state`
- `countryCode`
- `addressType`
- `createdAt`

Relacoes:
- 1:1 com `Order`

Constraints:
- `orderId` unico

Indices:
- `orderId` unique
- `postalCode`

### 22. OrderItem
Snapshot imutavel do item comprado.

Campos:
- `id`
- `orderId`
- `productId`
- `productVariantId`
- `productNameSnapshot`
- `productSlugSnapshot`
- `skuSnapshot`
- `categoryNameSnapshot`
- `fabricNameSnapshot`
- `sizeNameSnapshot`
- `colorNameSnapshot`
- `quantity`
- `unitBasePriceCents`
- `unitPromotionalPriceCents`
- `unitCustomizationPriceCents`
- `unitFinalPriceCents`
- `currencyCode`
- `customName`
- `customNumber`
- `customNotes`
- `createdAt`

Relacoes:
- N:1 com `Order`
- N:1 opcional com `Product`
- N:1 opcional com `ProductVariant`

Indices:
- `orderId`
- `productId`
- `productVariantId`
- `skuSnapshot`

### 23. OrderStatusHistory
Campos:
- `id`
- `orderId`
- `fromStatus`
- `toStatus`
- `reason`
- `actorType`
- `actorUserId`
- `traceId`
- `createdAt`

Relacoes:
- N:1 com `Order`
- N:1 opcional com `User`

Indices:
- `orderId`
- `toStatus`
- `createdAt`
- `actorUserId`

### 24. PaymentAttempt
Campos:
- `id`
- `orderId`
- `provider`
- `providerPaymentId`
- `providerOrderId`
- `idempotencyKey`
- `method`
- `status`
- `amountCents`
- `currencyCode`
- `failureCode`
- `failureMessage`
- `expiresAt`
- `authorizedAt`
- `approvedAt`
- `cancelledAt`
- `refundedAt`
- `createdAt`
- `updatedAt`

Relacoes:
- N:1 com `Order`
- 1:N com `PaymentStatusTransition`
- 1:N com `PaymentWebhookEvent`

Constraints:
- `idempotencyKey` unico
- `providerPaymentId` unico quando preenchido

Indices:
- `orderId`
- `providerPaymentId` unique
- `providerOrderId`
- `idempotencyKey` unique
- `status`
- `createdAt`
- `approvedAt`

### 25. PaymentStatusTransition
Campos:
- `id`
- `paymentAttemptId`
- `fromStatus`
- `toStatus`
- `source`
- `sourceReference`
- `reason`
- `traceId`
- `createdAt`

Relacoes:
- N:1 com `PaymentAttempt`

Indices:
- `paymentAttemptId`
- `toStatus`
- `createdAt`

### 26. PaymentWebhookEvent
Campos:
- `id`
- `paymentAttemptId`
- `providerEventId`
- `providerTopic`
- `signatureValidated`
- `rawBodyHash`
- `receivedAt`
- `processedAt`
- `processingStatus`
- `traceId`

Relacoes:
- N:1 opcional com `PaymentAttempt`

Constraints:
- `providerEventId` unico por provider/topic quando disponivel

Indices:
- `providerEventId`
- `providerTopic`
- `receivedAt`
- `processedAt`

### 27. Banner
Campos:
- `id`
- `slug`
- `title`
- `subtitle`
- `ctaLabel`
- `ctaHref`
- `desktopMediaId`
- `mobileMediaId`
- `status`
- `startsAt`
- `endsAt`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdByUserId`
- `updatedByUserId`

Relacoes:
- relacao opcional com midia de banner ou tabela propria de assets

Constraints:
- `slug` unico

Indices:
- `slug` unique
- `status`
- `sortOrder`
- `(startsAt, endsAt)`
- `deletedAt`

### 28. Favorite
Wishlist minima.

Campos:
- `id`
- `userId`
- `productId`
- `createdAt`

Relacoes:
- N:1 com `User`
- N:1 com `Product`

Constraints:
- `(userId, productId)` unico

Indices:
- `userId`
- `productId`

### 29. AuditEvent
Auditoria transversal do sistema.

Campos:
- `id`
- `eventType`
- `eventCategory`
- `actorType`
- `actorUserId`
- `targetType`
- `targetId`
- `requestId`
- `traceId`
- `ipAddress`
- `userAgent`
- `metadata`
- `outcome`
- `createdAt`

Relacoes:
- N:1 opcional com `User`

Indices:
- `eventType`
- `eventCategory`
- `actorUserId`
- `targetId`
- `traceId`
- `createdAt`

## Ownership rules canonicas

### Usuario
- `User` e dono de `Address`, `Cart`, `Order`, `Favorite`

### Admin
- Admin nao vira owner comercial das entidades do usuario
- Admin atua como ator de mutacao auditada

### Guest
- Guest cart e vinculado por `guestTokenHash`, nao por `User`

## Unique rules canonicas
- `User.email`
- `Role.name`
- `Permission.name`
- `(Permission.resource, Permission.action)`
- `Category.slug`
- `Fabric.slug`
- `SizeOption.slug`
- `ColorOption.slug`
- `Product.slug`
- `ProductVariant.sku`
- `(ProductVariant.productId, fabricId, sizeOptionId, colorOptionId)`
- `ProductMedia.storageKey`
- `Coupon.code`
- `ShippingMethod.code`
- `OrderAddress.orderId`
- `PaymentAttempt.idempotencyKey`
- `PaymentAttempt.providerPaymentId` quando presente
- `(Favorite.userId, Favorite.productId)`

## Cascades canonicas

### Delete fisico
- Deve ser evitado para entidades principais

### Cascades permitidos
- `Cart` -> `CartItem`
- `Order` -> `OrderAddress`
- `Order` -> `OrderItem`
- `Order` -> `OrderStatusHistory`
- `PaymentAttempt` -> `PaymentStatusTransition`

### Cascades proibidos
- apagar `Product` nao deve apagar `OrderItem`
- apagar `User` nao deve apagar `Order`
- apagar `Coupon` nao deve apagar `CouponUsage`

## Constraints canonicas de negocio

### Produto e variante
- produto publicado deve possuir ao menos uma variante vendavel ativa
- variante vendavel deve possuir SKU
- variante vendavel deve possuir preco base

### Cupom
- cupom inicial nao cumulativo
- `usedCount` nao pode exceder `maxUses` quando `maxUses` existir

### Pedido
- `totalAmountCents = subtotalCents - discountAmountCents + shippingAmountCents`
- pedido pago deve possuir ao menos uma tentativa de pagamento aprovada

### Pagamento
- uma tentativa aprovada deve referenciar um pedido valido
- transicoes de pagamento devem respeitar maquina de estados definida

## Indices de busca e operacao

### Catalogo
- `Product.slug`
- `(Product.status, Product.publishedAt)`
- `Product.categoryId`
- `(ProductVariant.productId, ProductVariant.status)`
- `ProductVariant.sku`
- `(ProductVariant.fabricId, sizeOptionId, colorOptionId)`

### Checkout e carrinho
- `Cart.userId`
- `Cart.guestTokenHash`
- `Cart.expiresAt`
- `CartItem.cartId`

### Pedido e pagamento
- `Order.userId`
- `Order.status`
- `Order.placedAt`
- `PaymentAttempt.orderId`
- `PaymentAttempt.status`
- `PaymentAttempt.providerPaymentId`
- `PaymentWebhookEvent.providerEventId`

### Admin e auditoria
- `AuditEvent.eventType`
- `AuditEvent.actorUserId`
- `AuditEvent.targetId`
- `AuditEvent.traceId`

## Observacoes de implementacao
- Arrays JSON devem ser evitados quando houver relacao clara de dominio.
- Snapshot transacional deve privilegiar colunas explicitas em `OrderItem` e `OrderAddress`.
- Regras de soft delete devem ser implementadas no repositorio/camada de acesso para evitar retorno acidental de registros arquivados.
- Entidades historicas nao devem depender de soft delete para preservar passado; elas devem ser naturalmente imutaveis.
