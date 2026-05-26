'use client';

import { useState } from 'react';
import { useCheckoutStore } from '@/stores/checkout-store';
import { cn } from '@/lib/cn';
import { CardForm } from '@/app/checkout/components/CardForm';
import type { PaymentMethod } from '@/types/api';

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; description: string }[] = [
  {
    method: 'PIX',
    label: 'PIX',
    description: 'Pagamento instantaneo via QR Code',
  },
  {
    method: 'CREDIT_CARD',
    label: 'Cartao de Credito',
    description: 'Pague em ate 12x',
  },
  {
    method: 'DEBIT_CARD',
    label: 'Cartao de Debito',
    description: 'Debito direto na conta',
  },
];

export function PaymentStep() {
  const {
    setStep,
    selectPaymentMethod,
    selectedPaymentMethod,
    setCardToken,
    setInstallments,
    setIssuerId,
    submitCheckout,
    createPayment,
    isLoading,
    error,
  } = useCheckoutStore();

  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardFormSubmit = async (data: {
    token: string;
    installments: number;
    issuerId: string;
  }) => {
    setCardError(null);
    setCardToken(data.token);
    setInstallments(data.installments);
    setIssuerId(data.issuerId);

    // Submit checkout to create order, then create payment
    await submitCheckout();
    const state = useCheckoutStore.getState();
    if (state.order?.id && !state.error) {
      await createPayment();
    }
  };

  const handlePixSubmit = async () => {
    setCardError(null);
    // For PIX, no card token needed
    setCardToken(null);
    setInstallments(1);
    setIssuerId(null);

    await submitCheckout();
    const state = useCheckoutStore.getState();
    if (state.order?.id && !state.error) {
      await createPayment();
    }
  };

  const handleBack = () => {
    setStep('shipping');
  };

  const handleCardError = (message: string) => {
    setCardError(message);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Forma de pagamento</h2>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {cardError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{cardError}</p>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => (
          <button
            key={option.method}
            onClick={() => selectPaymentMethod(option.method)}
            className={cn(
              'w-full rounded-md border p-4 text-left transition-all',
              selectedPaymentMethod === option.method
                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                : 'border-gray-200 hover:border-charcoal/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                  selectedPaymentMethod === option.method
                    ? 'border-accent bg-accent'
                    : 'border-gray-300'
                )}
              >
                {selectedPaymentMethod === option.method && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold">{option.label}</p>
                <p className="mt-0.5 text-xs text-charcoal/60">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Card Form */}
      {selectedPaymentMethod === 'CREDIT_CARD' && (
        <div className="rounded-md border border-gray-200 p-4">
          <h3 className="mb-4 text-sm font-bold">Dados do cartao</h3>
          <CardForm
            onSubmit={handleCardFormSubmit}
            onError={handleCardError}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Debit Card uses same form as credit card */}
      {selectedPaymentMethod === 'DEBIT_CARD' && (
        <div className="rounded-md border border-gray-200 p-4">
          <h3 className="mb-4 text-sm font-bold">Dados do cartao de debito</h3>
          <CardForm
            onSubmit={handleCardFormSubmit}
            onError={handleCardError}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* PIX Submit */}
      {selectedPaymentMethod === 'PIX' && (
        <div className="rounded-md border border-gray-200 p-4">
          <p className="mb-4 text-sm text-charcoal/70">
            Ao confirmar, voce recebera um QR Code para pagamento via PIX.
          </p>
          <button
            type="button"
            onClick={handlePixSubmit}
            disabled={isLoading}
            className={cn(
              'w-full rounded-md py-3 text-base font-bold transition-all',
              isLoading
                ? 'cursor-not-allowed bg-gray-400 text-white'
                : 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
            )}
          >
            {isLoading ? 'Processando...' : 'Gerar QR Code PIX'}
          </button>
        </div>
      )}

      {/* Navigation - only show back button when no card form is active */}
      {selectedPaymentMethod !== 'CREDIT_CARD' && selectedPaymentMethod !== 'DEBIT_CARD' && (
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-gray-50"
          >
            Voltar
          </button>
        </div>
      )}

      {(selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD') && (
        <button
          onClick={handleBack}
          className="text-sm font-medium text-charcoal/60 transition-colors hover:text-charcoal"
        >
          &larr; Voltar para frete
        </button>
      )}
    </div>
  );
}
