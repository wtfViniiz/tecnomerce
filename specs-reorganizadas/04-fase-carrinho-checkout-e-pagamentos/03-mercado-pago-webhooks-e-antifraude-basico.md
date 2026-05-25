# Fase 4 - Mercado Pago, Webhooks e Antifraude Basico

## Regras canonicas
- checkout transparente
- sem redirect checkout
- tokenizacao oficial no frontend
- backend nunca recebe ou persiste cartao bruto
- webhook e a fonte autoritativa do estado

## Regra de implementacao
- O primeiro ciclo deve usar checkout transparente embedded.
- Checkout Pro nao faz parte desta especificacao.

## Fluxo de pagamento
1. cliente monta checkout
2. frontend tokeniza dados sensiveis com componente oficial
3. backend cria pedido preliminar e tentativa de pagamento
4. backend envia requisicao com idempotency key
5. webhook confirma mudanca de estado
6. backend valida o evento server-side
7. pedido muda de estado de forma atomica e auditavel

## Persistencia obrigatoria
- `orders`
- `order_items`
- `payment_attempts`
- `payment_webhook_events`
- `payment_status_transitions`

## Regras de seguranca
- assinatura de webhook validada
- raw body preservado
- replay protection
- duplicate detection
- timeout e retry para chamadas externas

## Estados minimos de pagamento
- `PENDING`
- `PROCESSING`
- `AUTHORIZED`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `REFUNDED`
- `CHARGEDBACK`

## Gate de implementacao
Antes de codar a integracao real:
- confirmar versoes exatas de SDK/API oficial
- confirmar payloads oficiais
- confirmar politica oficial de assinatura de webhook
