export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
export const API_VERSION = 'v1';
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  cart: {
    get: '/cart',
    addItem: '/cart/items',
    updateItem: (id: string) => `/cart/items/${id}`,
    removeItem: (id: string) => `/cart/items/${id}`,
    merge: '/cart/merge',
  },
  checkout: {
    create: '/checkout',
  },
  payments: {
    create: '/payments',
    byOrder: (orderId: string) => `/payments/order/${orderId}`,
  },
  addresses: {
    list: '/addresses',
    create: '/addresses',
    update: (id: string) => `/addresses/${id}`,
    delete: (id: string) => `/addresses/${id}`,
    setDefault: (id: string) => `/addresses/${id}/default`,
  },
  shipping: {
    calculate: '/shipping/calculate',
    methods: '/shipping/methods',
  },
  coupons: {
    validate: '/coupons/validate',
  },
  orders: {
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
} as const;
