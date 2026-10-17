'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transactionSchema, TransactionInput } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionInput) => Promise<void>
  accounts: { id: string; name: string; type: string; balance: number }[]
  categories: { id: string; name: string; icon: string; color: string; type: string }[]
  goals?: { id: string; name: string }[]
  savingMethods?: { id: string; name: string }[]
  defaultValues?: Partial<TransactionInput>
  isEditing?: boolean
  editingId?: string
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  accounts,
  categories,
  goals = [],
  savingMethods = [],
  defaultValues,
  isEditing = false,
}: TransactionFormProps) {
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: 'EXPENSE',
      date: format(new Date(), 'yyyy-MM-dd'),
      accountId: accounts[0]?.id,
      ...defaultValues,
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const watchedType = form.watch('type')
  const filteredCategories = categories.filter(
    (cat) => cat.type === watchedType || cat.type === 'SAVING'
  )

  const handleSubmit = async (data: TransactionInput) => {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting transaction:', error)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex-1 space-y-4 overflow-y-auto p-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tipo
                </label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('type', value as TransactionInput['type'], { shouldDirty: true })
                  }
                  defaultValue={form.getValues('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">💰 Ingreso</SelectItem>
                    <SelectItem value="EXPENSE">💸 Gasto</SelectItem>
                    <SelectItem value="SAVING">🐷 Ahorro</SelectItem>
                    <SelectItem value="TRANSFER">🔄 Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Monto"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                error={form.formState.errors.amount?.message}
                {...form.register('amount', { valueAsNumber: true })}
              />

              <Input
                label="Descripción"
                placeholder="Ej. Supermercado, Salario..."
                error={form.formState.errors.description?.message}
                {...form.register('description')}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Cuenta
                </label>
                <Select
                  onValueChange={(value) => form.setValue('accountId', value, { shouldDirty: true })}
                  defaultValue={form.getValues('accountId') || accounts[0]?.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - ${account.balance.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.accountId && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.accountId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Categoría
                </label>
                <Select
                  onValueChange={(value) => form.setValue('categoryId', value, { shouldDirty: true })}
                  defaultValue={form.getValues('categoryId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span style={{ color: category.color }}>{category.icon}</span>
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Fecha"
                type="date"
                error={form.formState.errors.date?.message}
                {...form.register('date')}
              />

              {goals.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Meta (opcional)
                  </label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue('goalId', value === 'none' ? undefined : value, { shouldDirty: true })
                    }
                    defaultValue={form.getValues('goalId') || 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin meta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin meta</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {savingMethods.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Método de Ahorro (opcional)
                  </label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue('savingMethodId', value === 'none' ? undefined : value, { shouldDirty: true })
                    }
                    defaultValue={form.getValues('savingMethodId') || 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin método</SelectItem>
                      {savingMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Input label="Notas (opcional)" placeholder="Detalles..." {...form.register('notes')} />

              <Separator />

              <div className="flex gap-2 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" loading={isSubmitting}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Transacción'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
