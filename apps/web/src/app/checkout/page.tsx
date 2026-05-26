'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { useAuthStore } from '@/stores/auth-store';
import { CartStep } from './components/CartStep';
import { AddressStep } from './components/AddressStep';
import { ShippingStep } from './components/ShippingStep';
import { PaymentStep } from './components/PaymentStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import { CheckoutProgress } from './components/CheckoutProgress';

const STEPS = ['cart', 'address', 'shipping', 'payment', 'confirmation'] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { step } = useCheckoutStore();
  const { fetchCart } = useCartStore();
  const { isAuthenticated, isLoading: authLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCart();
    }
  }, [authLoading, isAuthenticated, fetchCart]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="py-16 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary">Acesso restrito</h1>
            <p className="mt-4 text-sm text-charcoal/60">
              Voce precisa estar logado para acessar o checkout.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 rounded-md bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-medium transition-all hover:bg-primary/90"
            >
              Fazer login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
        <CheckoutProgress currentStep={step} steps={[...STEPS]} />
        <div className="mt-8">
          {step === 'cart' && <CartStep />}
          {step === 'address' && <AddressStep />}
          {step === 'shipping' && <ShippingStep />}
          {step === 'payment' && <PaymentStep />}
          {step === 'confirmation' && <ConfirmationStep />}
        </div>
      </div>
    </main>
  );
}
