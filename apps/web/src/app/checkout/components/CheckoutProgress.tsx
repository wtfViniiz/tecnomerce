'use client';

interface CheckoutProgressProps {
  currentStep: string;
  steps: string[];
}

const STEP_LABELS: Record<string, string> = {
  cart: 'Carrinho',
  address: 'Endereço',
  shipping: 'Frete',
  payment: 'Pagamento',
  confirmation: 'Confirmação',
};

export function CheckoutProgress({ currentStep, steps }: CheckoutProgressProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                index <= currentIndex
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                index <= currentIndex ? 'text-primary' : 'text-gray-400'
              }`}
            >
              {STEP_LABELS[step] || step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-2 h-0.5 flex-1 ${
                index < currentIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
