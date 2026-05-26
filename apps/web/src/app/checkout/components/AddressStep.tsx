'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCheckoutStore } from '@/stores/checkout-store';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import { cn } from '@/lib/cn';
import { addressSchema, type AddressFormData } from '@/schemas/address.schema';
import type { Address } from '@/types/api';

const emptyDefaults: AddressFormData = {
  label: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

export function AddressStep() {
  const { setStep, selectAddress, selectedAddressId } = useCheckoutStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: emptyDefaults,
  });

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Address[]>(ENDPOINTS.addresses.list);
      setAddresses(response.data ?? []);
    } catch {
      setError('Erro ao carregar enderecos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSelect = (addressId: string) => {
    selectAddress(addressId);
  };

  const handleContinue = () => {
    if (selectedAddressId) {
      setStep('shipping');
    }
  };

  const handleBack = () => {
    setStep('cart');
  };

  const handleCreateAddress = async (data: AddressFormData) => {
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await apiClient.post<Address>(ENDPOINTS.addresses.create, {
        label: data.label,
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: 'BR',
      });

      const newAddress = response.data;
      if (newAddress) {
        setAddresses((prev) => [...prev, newAddress]);
        selectAddress(newAddress.id);
        setShowForm(false);
        resetForm(emptyDefaults);
      }
    } catch {
      setFormError('Erro ao criar endereco');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Endereco de entrega</h2>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchAddresses}
            className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((address) => (
          <button
            key={address.id}
            onClick={() => handleSelect(address.id)}
            className={cn(
              'w-full rounded-md border p-4 text-left transition-all',
              selectedAddressId === address.id
                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                : 'border-gray-200 hover:border-charcoal/30'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">
                  {address.label}
                  {address.isDefault && (
                    <span className="ml-2 inline-block rounded-sm bg-charcoal/10 px-1.5 py-0.5 text-[10px] font-bold text-charcoal">
                      Padrao
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-charcoal/70">
                  {address.street}, {address.number}
                  {address.complement ? ` - ${address.complement}` : ''}
                </p>
                <p className="text-sm text-charcoal/70">
                  {address.neighborhood} - {address.city}/{address.state}
                </p>
                <p className="text-sm text-charcoal/70">CEP: {address.zipCode}</p>
              </div>
              <div
                className={cn(
                  'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                  selectedAddressId === address.id
                    ? 'border-accent bg-accent'
                    : 'border-gray-300'
                )}
              >
                {selectedAddressId === address.id && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Add New Address */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-md border-2 border-dashed border-gray-300 p-4 text-sm font-bold text-charcoal transition-colors hover:border-accent hover:text-accent"
        >
          + Adicionar novo endereco
        </button>
      ) : (
        <form onSubmit={handleSubmit(handleCreateAddress)} className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="text-sm font-bold">Novo endereco</h3>

          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="label" className="mb-1 block text-xs font-medium text-charcoal">
                Identificacao
              </label>
              <input
                id="label"
                type="text"
                {...register('label')}
                placeholder="Ex: Casa, Trabalho"
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.label && (
                <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="zipCode" className="mb-1 block text-xs font-medium text-charcoal">
                CEP
              </label>
              <input
                id="zipCode"
                type="text"
                {...register('zipCode')}
                placeholder="00000-000"
                maxLength={9}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.zipCode && (
                <p className="mt-1 text-xs text-red-600">{errors.zipCode.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="street" className="mb-1 block text-xs font-medium text-charcoal">
                Rua
              </label>
              <input
                id="street"
                type="text"
                {...register('street')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.street && (
                <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="number" className="mb-1 block text-xs font-medium text-charcoal">
                Numero
              </label>
              <input
                id="number"
                type="text"
                {...register('number')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.number && (
                <p className="mt-1 text-xs text-red-600">{errors.number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="complement" className="mb-1 block text-xs font-medium text-charcoal">
                Complemento
              </label>
              <input
                id="complement"
                type="text"
                {...register('complement')}
                placeholder="Opcional"
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="neighborhood" className="mb-1 block text-xs font-medium text-charcoal">
                Bairro
              </label>
              <input
                id="neighborhood"
                type="text"
                {...register('neighborhood')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.neighborhood && (
                <p className="mt-1 text-xs text-red-600">{errors.neighborhood.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="mb-1 block text-xs font-medium text-charcoal">
                Cidade
              </label>
              <input
                id="city"
                type="text"
                {...register('city')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="mb-1 block text-xs font-medium text-charcoal">
                Estado
              </label>
              <input
                id="state"
                type="text"
                {...register('state')}
                maxLength={2}
                placeholder="UF"
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.state && (
                <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm(emptyDefaults);
                setFormError(null);
              }}
              className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className={cn(
                'rounded-sm px-4 py-2 text-sm font-bold text-white transition-colors',
                formLoading
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              {formLoading ? 'Salvando...' : 'Salvar endereco'}
            </button>
          </div>
        </form>
      )}

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
          disabled={!selectedAddressId}
          className={cn(
            'flex-1 rounded-md py-3 text-base font-bold transition-all',
            selectedAddressId
              ? 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          )}
        >
          Continuar para frete
        </button>
      </div>
    </div>
  );
}
