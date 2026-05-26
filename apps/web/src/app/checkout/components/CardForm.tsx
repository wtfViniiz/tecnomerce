'use client';

import { useEffect, useRef, useState } from 'react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { MP_PUBLIC_KEY } from '@/constants/api';
import type { MercadoPagoInstance, MPCardFormInstance } from '@/types/mercadopago';

interface CardFormData {
  token: string;
  installments: number;
  issuerId: string;
}

interface CardFormProps {
  onSubmit: (data: CardFormData) => void;
  onError: (message: string) => void;
  isLoading: boolean;
}

export function CardForm({ onSubmit, onError, isLoading }: CardFormProps) {
  const mountedRef = useRef(false);
  const cardFormRef = useRef<MPCardFormInstance | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (!MP_PUBLIC_KEY) {
      onError('Chave publica do MercadoPago nao configurada');
      return;
    }

    // Initialize the React SDK (required by spec)
    initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });

    // Load the vanilla JS SDK for cardForm iframe support
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;

    script.onload = () => {
      const MPConstructor = window.MercadoPago;

      if (!MPConstructor) {
        onError('SDK do MercadoPago nao carregado');
        return;
      }

      const mp = new MPConstructor(MP_PUBLIC_KEY, { locale: 'pt-BR' });

      const cardForm = mp.cardForm({
        amount: '1',
        iframe: true,
        form: {
          id: 'form-checkout',
          cardNumber: { id: 'form-checkout__cardNumber' },
          expirationDate: { id: 'form-checkout__expirationDate' },
          securityCode: { id: 'form-checkout__securityCode' },
          cardholderName: { id: 'form-checkout__cardholderName' },
          issuer: { id: 'form-checkout__issuer' },
          installments: { id: 'form-checkout__installments' },
          identificationNumber: { id: 'form-checkout__identificationNumber' },
        },
        callbacks: {
          onFormMounted: (error: unknown) => {
            if (error) {
              onError('Erro ao montar formulario do cartao');
            } else {
              setSdkReady(true);
            }
          },
          onFetching: () => {
            // Tokenization in progress
          },
        },
      });

      cardForm.mount();
      cardFormRef.current = cardForm;
    };

    script.onerror = () => {
      onError('Erro ao carregar SDK do MercadoPago');
    };

    document.head.appendChild(script);

    return () => {
      if (cardFormRef.current) {
        try {
          cardFormRef.current.unmount();
        } catch {
          // Ignore unmount errors
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  const handleSubmit = async () => {
    if (!cardFormRef.current) {
      onError('Formulario do cartao nao inicializado');
      return;
    }

    try {
      // Get card data from form inputs
      const cardNumber = (
        document.querySelector('[data-checkout="cardNumber"]') as HTMLInputElement
      )?.value?.replace(/\s/g, '');
      const cardholderName = (
        document.querySelector('[data-checkout="cardholderName"]') as HTMLInputElement
      )?.value;
      const identificationNumber = (
        document.querySelector('[data-checkout="docNumber"]') as HTMLInputElement
      )?.value;

      if (!cardNumber || !cardholderName || !identificationNumber) {
        onError('Preencha todos os campos do cartao');
        return;
      }

      // Use the cardForm's getCardToken method
      const tokenData = await cardFormRef.current.getCardToken();

      if (!tokenData?.id) {
        onError('Erro ao tokenizar o cartao');
        return;
      }

      const installmentsSelect = document.querySelector(
        '[data-checkout="installments"]'
      ) as HTMLSelectElement | null;
      const installments = installmentsSelect?.value
        ? parseInt(installmentsSelect.value, 10)
        : 1;

      const issuerSelect = document.querySelector(
        '[data-checkout="issuer"]'
      ) as HTMLSelectElement | null;
      const issuerId = issuerSelect?.value ?? '';

      onSubmit({
        token: tokenData.id,
        installments,
        issuerId,
      });
    } catch {
      onError('Erro ao processar dados do cartao');
    }
  };

  return (
    <div className="space-y-4">
      <form id="form-checkout" className="space-y-4">
        <div>
          <label
            htmlFor="form-checkout__cardNumber"
            className="mb-1 block text-xs font-medium text-charcoal"
          >
            Numero do cartao
          </label>
          <div
            id="form-checkout__cardNumber"
            className="h-11 rounded-sm border border-gray-300 px-3 [&>iframe]:h-full [&>iframe]:w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="form-checkout__expirationDate"
              className="mb-1 block text-xs font-medium text-charcoal"
            >
              Validade
            </label>
            <div
              id="form-checkout__expirationDate"
              className="h-11 rounded-sm border border-gray-300 px-3 [&>iframe]:h-full [&>iframe]:w-full"
            />
          </div>
          <div>
            <label
              htmlFor="form-checkout__securityCode"
              className="mb-1 block text-xs font-medium text-charcoal"
            >
              CVV
            </label>
            <div
              id="form-checkout__securityCode"
              className="h-11 rounded-sm border border-gray-300 px-3 [&>iframe]:h-full [&>iframe]:w-full"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="form-checkout__cardholderName"
            className="mb-1 block text-xs font-medium text-charcoal"
          >
            Nome no cartao
          </label>
          <input
            id="form-checkout__cardholderName"
            type="text"
            data-checkout="cardholderName"
            placeholder="Nome como esta no cartao"
            className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="form-checkout__identificationNumber"
            className="mb-1 block text-xs font-medium text-charcoal"
          >
            CPF
          </label>
          <input
            id="form-checkout__identificationNumber"
            type="text"
            data-checkout="docNumber"
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="form-checkout__issuer"
              className="mb-1 block text-xs font-medium text-charcoal"
            >
              Banco emissor
            </label>
            <select
              id="form-checkout__issuer"
              data-checkout="issuer"
              className="h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Selecione</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="form-checkout__installments"
              className="mb-1 block text-xs font-medium text-charcoal"
            >
              Parcelas
            </label>
            <select
              id="form-checkout__installments"
              data-checkout="installments"
              className="h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Selecione</option>
            </select>
          </div>
        </div>
      </form>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !sdkReady}
        className={`w-full rounded-md py-3 text-base font-bold transition-all ${
          isLoading || !sdkReady
            ? 'cursor-not-allowed bg-gray-400 text-white'
            : 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
        }`}
      >
        {!sdkReady
          ? 'Carregando formulario...'
          : isLoading
            ? 'Processando...'
            : 'Pagar com cartao'}
      </button>
    </div>
  );
}
