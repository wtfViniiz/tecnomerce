'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import { cn } from '@/lib/cn';

interface CouponValidation {
  valid: boolean;
  discount?: number;
  message?: string;
}

export function CartStep() {
  const { cart, isLoading, error, updateItem, removeItem, clearError } = useCartStore();
  const { setStep, setCouponCode, couponCode } = useCheckoutStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await apiClient.post<CouponValidation>(ENDPOINTS.coupons.validate, {
        code: couponInput.trim(),
      });
      const data = response.data;
      if (data?.valid) {
        setCouponCode(couponInput.trim());
        setCouponDiscount(data.discount ?? null);
        setCouponMessage('Cupom aplicado com sucesso!');
      } else {
        setCouponCode(null);
        setCouponDiscount(null);
        setCouponMessage(data?.message ?? 'Cupom invalido');
      }
    } catch {
      setCouponCode(null);
      setCouponDiscount(null);
      setCouponMessage('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    setCouponCode(null);
    setCouponDiscount(null);
    setCouponMessage(null);
  };

  const handleContinue = () => {
    if (cart && cart.items.length > 0) {
      setStep('address');
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading && !cart) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={clearError}
          className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-charcoal">Seu carrinho esta vazio</p>
        <p className="mt-2 text-sm text-charcoal/60">
          Adicione produtos ao carrinho para continuar.
        </p>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountValue = couponDiscount ? (subtotal * couponDiscount) / 100 : 0;
  const total = subtotal - discountValue;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Seu Carrinho</h2>

      {/* Cart Items */}
      <div className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
              {item.product.media[0] ? (
                <img
                  src={item.product.media[0].url}
                  alt={item.product.media[0].alt ?? item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-charcoal/40">
                  Sem imagem
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{item.product.name}</h3>
              {item.variant && (
                <p className="mt-0.5 text-xs text-charcoal/60">{item.variant.name}</p>
              )}
              <p className="mt-1 text-sm font-medium text-accent">
                {formatPrice(item.price)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                disabled={isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-300 text-sm font-bold text-charcoal transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateItem(item.id, item.quantity + 1)}
                disabled={isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-300 text-sm font-bold text-charcoal transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right text-sm font-bold">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button
              onClick={() => removeItem(item.id)}
              disabled={isLoading}
              className="ml-2 text-sm font-medium text-charcoal/50 transition-colors hover:text-accent disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="rounded-md border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-bold">Cupom de desconto</h3>
        {couponCode ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block rounded-sm bg-charcoal/10 px-2 py-1 text-xs font-bold text-charcoal">
                {couponCode}
              </span>
              {couponDiscount !== null && (
                <span className="ml-2 text-xs text-charcoal/60">
                  {couponDiscount}% de desconto
                </span>
              )}
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs font-medium text-accent hover:text-accent-hover"
            >
              Remover
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Digite seu cupom"
              className="flex-1 rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleValidateCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className={cn(
                'rounded-sm px-4 py-2 text-sm font-bold transition-colors',
                couponLoading || !couponInput.trim()
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-charcoal text-white hover:bg-charcoal-surface'
              )}
            >
              {couponLoading ? 'Validando...' : 'Aplicar'}
            </button>
          </div>
        )}
        {couponMessage && (
          <p
            className={cn(
              'mt-2 text-xs font-medium',
              couponDiscount !== null ? 'text-green-600' : 'text-red-600'
            )}
          >
            {couponMessage}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-md border border-gray-200 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Subtotal ({cart.itemCount} itens)</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Desconto</span>
              <span className="font-medium text-green-600">-{formatPrice(discountValue)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-base font-bold">Total</span>
              <span className="text-lg font-bold text-accent">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!cart || cart.items.length === 0}
        className={cn(
          'w-full rounded-md py-3 text-base font-bold transition-all',
          cart && cart.items.length > 0
            ? 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        )}
      >
        Continuar para endereco
      </button>
    </div>
  );
}
