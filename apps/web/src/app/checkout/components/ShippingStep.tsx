'use client';

import { useEffect, useState } from 'react';
import { useCheckoutStore } from '@/stores/checkout-store';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import { cn } from '@/lib/cn';
import type { Address, ShippingMethod } from '@/types/api';

export function ShippingStep() {
  const {
    setStep,
    selectShippingMethod,
    selectedShippingMethodId,
    selectedAddressId,
  } = useCheckoutStore();

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedAddressId) {
        setStep('address');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const addressResponse = await apiClient.get<Address[]>(ENDPOINTS.addresses.list);
        const addresses = addressResponse.data ?? [];
        const selected = addresses.find((a) => a.id === selectedAddressId);

        if (!selected) {
          setError('Endereco nao encontrado');
          setLoading(false);
          return;
        }

        setAddress(selected);

        const shippingResponse = await apiClient.post<ShippingMethod[]>(
          ENDPOINTS.shipping.calculate,
          { zipCode: selected.zipCode }
        );
        setMethods(shippingResponse.data ?? []);
      } catch {
        setError('Erro ao calcular frete');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAddressId, setStep]);

  const handleContinue = () => {
    if (selectedShippingMethodId) {
      setStep('payment');
    }
  };

  const handleBack = () => {
    setStep('address');
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Opcoes de frete</h2>

      {/* Selected Address Summary */}
      {address && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold text-charcoal/60 uppercase tracking-wide">
            Endereco de entrega
          </p>
          <p className="mt-1 text-sm font-bold">{address.label}</p>
          <p className="text-sm text-charcoal/70">
            {address.street}, {address.number}
            {address.complement ? ` - ${address.complement}` : ''}
          </p>
          <p className="text-sm text-charcoal/70">
            {address.neighborhood} - {address.city}/{address.state} - CEP: {address.zipCode}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Shipping Methods */}
      <div className="space-y-3">
        {methods.length === 0 && !error && (
          <p className="text-sm text-charcoal/60">
            Nenhuma opcao de frete disponivel para este endereco.
          </p>
        )}

        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => selectShippingMethod(method.id)}
            className={cn(
              'w-full rounded-md border p-4 text-left transition-all',
              selectedShippingMethodId === method.id
                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                : 'border-gray-200 hover:border-charcoal/30'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                    selectedShippingMethodId === method.id
                      ? 'border-accent bg-accent'
                      : 'border-gray-300'
                  )}
                >
                  {selectedShippingMethodId === method.id && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{method.name}</p>
                  {method.description && (
                    <p className="mt-0.5 text-xs text-charcoal/60">{method.description}</p>
                  )}
                  <p className="mt-1 text-xs text-charcoal/60">
                    Prazo: {method.estimatedDays} {method.estimatedDays === 1 ? 'dia util' : 'dias uteis'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-accent">
                {method.price === 0 ? 'Gratis' : formatPrice(method.price)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handleBack}
          className="rounded-md border border-gray-300 px-6 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedShippingMethodId}
          className={cn(
            'flex-1 rounded-md py-3 text-base font-bold transition-all',
            selectedShippingMethodId
              ? 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          )}
        >
          Continuar para pagamento
        </button>
      </div>
    </div>
  );
}
