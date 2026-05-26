import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obrigatorio')
    .email('Email invalido'),
  password: z
    .string()
    .min(1, 'Senha obrigatoria')
    .min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome obrigatorio')
    .min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z
    .string()
    .min(1, 'Email obrigatorio')
    .email('Email invalido'),
  password: z
    .string()
    .min(1, 'Senha obrigatoria')
    .min(6, 'Senha deve ter no minimo 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmacao de senha obrigatoria'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
