'use client';

import { useEffect, useRef, useState } from 'react';
import { useCheckoutStore } from '@/stores/checkout-store';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import { cn } from '@/lib/cn';
import { PixQrCode } from '@/app/checkout/components/PixQrCode';
import type { PaymentAttempt } from '@/types/api';

type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'IN_PROCESS' | string;

export function ConfirmationStep() {
  const { order, paymentAttempt, selectedPaymentMethod, reset } = useCheckoutStore();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    paymentAttempt?.status ?? 'PENDING'
  );
  const [pollingError, setPollingError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!order?.id) return;

    // Poll for payment status updates
    const pollStatus = async () => {
      try {
        const response = await apiClient.get<PaymentAttempt>(ENDPOINTS.payments.byOrder(order.id));
        const attempt = response.data;
        if (attempt?.status) {
          setPaymentStatus(attempt.status);
          setPollingError(null);

          // Stop polling when payment is resolved
          if (
            attempt.status === 'APPROVED' ||
            attempt.status === 'REJECTED' ||
            attempt.status === 'CANCELLED'
          ) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch {
        setPollingError('Erro ao verificar status do pagamento');
      }
    };

    // Initial poll after a short delay
    const initialTimeout = setTimeout(pollStatus, 3000);

    // Continue polling every 5 seconds
    intervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [order?.id]);

  const handleNewOrder = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    reset();
  };

  const isPix = selectedPaymentMethod === 'PIX';
  const isCard = selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD';

  const isApproved = paymentStatus === 'APPROVED';
  const isPending = paymentStatus === 'PENDING' || paymentStatus === 'IN_PROCESS';
  const isFailed = paymentStatus === 'REJECTED' || paymentStatus === 'CANCELLED';

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-charcoal">Nenhum pedido encontrado</p>
        <button
          onClick={handleNewOrder}
          className="mt-4 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Voltar ao inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Confirmacao do Pedido</h2>

      {/* Order Info */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-bold text-charcoal/60 uppercase tracking-wide">
          Numero do pedido
        </p>
        <p className="mt-1 font-mono text-sm font-bold text-primary">{order.id}</p>
      </div>

      {/* Status */}
      <div
        className={cn(
          'rounded-md p-4',
          isApproved && 'bg-green-50',
          isPending && 'bg-yellow-50',
          isFailed && 'bg-red-50'
        )}
      >
        {isApproved && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-green-700">Pagamento aprovado!</p>
            <p className="mt-1 text-sm text-green-600">
              Seu pedido foi confirmado e sera processado em breve.
            </p>
          </div>
        )}

        {isPending && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
            </div>
            <p className="text-lg font-bold text-yellow-700">Aguardando pagamento...</p>
            {isPix && (
              <p className="mt-1 text-sm text-yellow-600">
                Escaneie o QR Code abaixo ou copie o codigo para pagar.
              </p>
            )}
            {isCard && (
              <p className="mt-1 text-sm text-yellow-600">
                Estamos processando o pagamento do seu cartao.
              </p>
            )}
          </div>
        )}

        {isFailed && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-red-700">Pagamento nao realizado</p>
            <p className="mt-1 text-sm text-red-600">
              Houve um problema com seu pagamento. Tente novamente.
            </p>
          </div>
        )}

        {pollingError && (
          <p className="mt-3 text-center text-xs text-charcoal/50">{pollingError}</p>
        )}
      </div>

      {/* PIX QR Code - only show while pending */}
      {isPix && isPending && paymentAttempt?.qrCodeBase64 && (
        <div className="rounded-md border border-gray-200 p-4">
          <h3 className="mb-4 text-sm font-bold text-center">Pague com PIX</h3>
          <PixQrCode
            qrCodeBase64={paymentAttempt.qrCodeBase64}
            copyPasteCode={paymentAttempt.qrCode ?? ''}
          />
        </div>
      )}

      {/* Card Status */}
      {isCard && (
        <div className="rounded-md border border-gray-200 p-4">
          <h3 className="mb-2 text-sm font-bold">Detalhes do pagamento</h3>
          <div className="space-y-1">
            <p className="text-sm text-charcoal/70">
              <span className="font-medium">Metodo:</span>{' '}
              {selectedPaymentMethod === 'CREDIT_CARD' ? 'Cartao de Credito' : 'Cartao de Debito'}
            </p>
            {paymentAttempt?.id && (
              <p className="text-sm text-charcoal/70">
                <span className="font-medium">ID da transacao:</span>{' '}
                <span className="font-mono text-xs">{paymentAttempt.id}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {isApproved && (
          <button
            onClick={handleNewOrder}
            className="flex-1 rounded-md bg-primary py-3 text-base font-bold text-primary-foreground shadow-medium transition-all hover:bg-primary/90"
          >
            Fazer nova compra
          </button>
        )}
        {isFailed && (
          <>
            <button
              onClick={handleNewOrder}
              className="flex-1 rounded-md border border-gray-300 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-gray-50"
            >
              Voltar ao inicio
            </button>
            <button
              onClick={() => useCheckoutStore.getState().setStep('payment')}
              className="flex-1 rounded-md bg-primary py-3 text-base font-bold text-primary-foreground shadow-medium transition-all hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
