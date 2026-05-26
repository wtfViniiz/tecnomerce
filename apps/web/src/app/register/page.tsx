'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema';
import { cn } from '@/lib/cn';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const success = await registerUser(data.name, data.email, data.password);
    if (success) {
      router.push('/checkout');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="rounded-md border border-gray-200 p-8 shadow-soft">
          <h1 className="text-2xl font-bold tracking-tight text-center">Criar conta</h1>
          <p className="mt-2 text-center text-sm text-charcoal/60">
            Cadastre-se para finalizar sua compra
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-1 text-xs font-medium text-accent hover:text-accent-hover"
              >
                Fechar
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs font-medium text-charcoal"
              >
                Nome
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Seu nome completo"
                {...register('name')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-medium text-charcoal"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-medium text-charcoal"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimo 6 caracteres"
                {...register('password')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-xs font-medium text-charcoal"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                {...register('confirmPassword')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full rounded-md py-3 text-base font-bold transition-all',
                isLoading
                  ? 'cursor-not-allowed bg-gray-400 text-white'
                  : 'bg-primary text-primary-foreground shadow-medium hover:bg-primary/90'
              )}
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal/60">
            Ja tem uma conta?{' '}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
