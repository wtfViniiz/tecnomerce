import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';
import type {
  Address,
  ShippingMethod,
  PaymentMethod,
  Order,
  PaymentAttempt,
} from '@/types/api';

type CheckoutStep = 'cart' | 'address' | 'shipping' | 'payment' | 'confirmation';

interface CheckoutState {
  step: CheckoutStep;
  selectedAddressId: string | null;
  selectedShippingMethodId: string | null;
  selectedPaymentMethod: PaymentMethod | null;
  couponCode: string | null;
  cardToken: string | null;
  installments: number;
  issuerId: string | null;
  order: Order | null;
  paymentAttempt: PaymentAttempt | null;
  isLoading: boolean;
  error: string | null;

  setStep: (step: CheckoutStep) => void;
  selectAddress: (addressId: string) => void;
  selectShippingMethod: (methodId: string) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;
  setCouponCode: (code: string | null) => void;
  setCardToken: (token: string | null) => void;
  setInstallments: (installments: number) => void;
  setIssuerId: (issuerId: string | null) => void;
  submitCheckout: () => Promise<void>;
  createPayment: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  step: 'cart' as CheckoutStep,
  selectedAddressId: null,
  selectedShippingMethodId: null,
  selectedPaymentMethod: null,
  couponCode: null,
  cardToken: null,
  installments: 1,
  issuerId: null,
  order: null,
  paymentAttempt: null,
  isLoading: false,
  error: null,
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  selectAddress: (addressId) => set({ selectedAddressId: addressId }),

  selectShippingMethod: (methodId) => set({ selectedShippingMethodId: methodId }),

  selectPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  setCouponCode: (code) => set({ couponCode: code }),

  setCardToken: (token) => set({ cardToken: token }),

  setInstallments: (installments) => set({ installments }),

  setIssuerId: (issuerId) => set({ issuerId }),

  submitCheckout: async () => {
    const state = get();
    if (!state.selectedAddressId || !state.selectedShippingMethodId || !state.selectedPaymentMethod) {
      set({ error: 'Missing required checkout information' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ orderId: string }>(ENDPOINTS.checkout.create, {
        addressId: state.selectedAddressId,
        shippingMethodId: state.selectedShippingMethodId,
        paymentMethod: state.selectedPaymentMethod,
        couponCode: state.couponCode,
        cardToken: state.cardToken,
        installments: state.installments,
        issuerId: state.issuerId,
      });

      set({
        order: { id: response.data!.orderId } as Order,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      set({ error: message, isLoading: false });
    }
  },

  createPayment: async () => {
    const state = get();
    if (!state.order?.id || !state.selectedPaymentMethod) {
      set({ error: 'Missing order or payment method' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<PaymentAttempt>(ENDPOINTS.payments.create, {
        orderId: state.order.id,
        method: state.selectedPaymentMethod,
        token: state.cardToken,
        installments: state.installments,
        issuerId: state.issuerId,
      });

      set({
        paymentAttempt: response.data!,
        step: 'confirmation',
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      set({ error: message, isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
