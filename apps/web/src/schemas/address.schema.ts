import { z } from 'zod';

export const addressSchema = z.object({
  label: z
    .string()
    .min(1, 'Identificacao obrigatoria')
    .max(50, 'Maximo 50 caracteres'),
  street: z
    .string()
    .min(1, 'Rua obrigatoria'),
  number: z
    .string()
    .min(1, 'Numero obrigatorio'),
  complement: z.string(),
  neighborhood: z
    .string()
    .min(1, 'Bairro obrigatorio'),
  city: z
    .string()
    .min(1, 'Cidade obrigatoria'),
  state: z
    .string()
    .min(1, 'Estado obrigatorio')
    .max(2, 'Use a sigla do estado (UF)'),
  zipCode: z
    .string()
    .min(1, 'CEP obrigatorio')
    .regex(/^\d{5}-?\d{3}$/, 'CEP invalido (ex: 00000-000)'),
});

export type AddressFormData = z.infer<typeof addressSchema>;
