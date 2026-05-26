export interface MPCardFormConfig {
  amount: string;
  iframe: boolean;
  form: {
    id: string;
    cardNumber: { id: string };
    expirationDate: { id: string };
    securityCode: { id: string };
    cardholderName: { id: string };
    issuer: { id: string };
    installments: { id: string };
    identificationNumber: { id: string };
  };
  callbacks: {
    onFormMounted: (error: unknown) => void;
    onFetching: () => void;
  };
}

export interface MPCardFormInstance {
  mount: () => void;
  unmount: () => void;
  getCardToken: () => Promise<{ id: string } | null>;
  createCardToken: (data: Record<string, string>) => Promise<{ id: string }>;
}

export interface MercadoPagoInstance {
  cardForm: (config: MPCardFormConfig) => MPCardFormInstance;
}

export interface MercadoPagoConstructor {
  new (
    key: string,
    options?: { locale?: string }
  ): MercadoPagoInstance;
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
  }
}
