import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const transactionSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'TRANSFER']),
  description: z.string().min(1, 'Descripción requerida').max(100),
  notes: z.string().max(500).optional(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Fecha inválida'),
  accountId: z.string().min(1, 'Cuenta requerida'),
  categoryId: z.string().optional(),
  goalId: z.string().optional(),
  savingMethodId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING']),
  parentId: z.string().optional(),
})

export const goalSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  description: z.string().max(500).optional(),
  targetAmount: z.coerce.number().positive('Monto objetivo debe ser positivo'),
  currency: z.string().default('MXN'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val))),
  targetDate: z.string().refine(val => !isNaN(Date.parse(val))),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  periodStart: z.string().refine(val => !isNaN(Date.parse(val))),
  periodEnd: z.string().refine(val => !isNaN(Date.parse(val))),
  categoryId: z.string().min(1),
})

export const savingMethodSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum([
    'PERCENTAGE_50_30_20',
    'ENVELOPE_SYSTEM',
    'ROUND_UP',
    'PAY_YOURSELF_FIRST',
    'ZERO_BASED',
    'CUSTOM'
  ]),
  configuration: z.record(z.string(), z.unknown()),
  allocations: z.array(z.object({
    percentage: z.number().min(0).max(100),
    targetAccountId: z.string(),
    priority: z.number().int().min(0),
  })).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type GoalInput = z.infer<typeof goalSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type SavingMethodInput = z.infer<typeof savingMethodSchema>