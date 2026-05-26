'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import { cn } from '@/lib/cn';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);
    if (success) {
      router.push('/checkout');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="rounded-md border border-gray-200 p-8 shadow-soft">
          <h1 className="text-2xl font-bold tracking-tight text-center">Entrar</h1>
          <p className="mt-2 text-center text-sm text-charcoal/60">
            Acesse sua conta para continuar
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
                autoComplete="current-password"
                placeholder="Sua senha"
                {...register('password')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
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
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal/60">
            Nao tem uma conta?{' '}
            <Link
              href="/register"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
