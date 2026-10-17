'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transactionSchema, TransactionInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/animated'

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  onSubmit, // legacy, now handled by hooks
  accounts,
  categories,
  goals = [],
  savingMethods = [],
  defaultValues,
  isEditing = false,
  editingId,
}: TransactionFormProps) {
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: format(new Date(), 'yyyy-MM-dd'),
      ...defaultValues,
    },
  })

  const handleSubmit = async (data: TransactionInput) => {
    try {
      if (isEditing && editingId) {
        await updateMutation.mutateAsync({ id: editingId, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      form.reset({ type: 'EXPENSE', date: format(new Date(), 'yyyy-MM-dd') })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting transaction:', error)
    }
  }

  const watchedType = form.watch('type')
  const filteredCategories = categories.filter(
    cat => cat.type === watchedType || cat.type === 'SAVING'
  )

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
              </motion.h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </motion.div>

            <AnimatePresence mode="wait">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                <FadeIn>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tipo</label>
                    <Select
                      onValueChange={value => form.setValue('type', value as TransactionInput['type'], { shouldDirty: true })}
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
                </FadeIn>

                <FadeIn delay={0.05}>
                  <Input
                    label="Monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    error={form.formState.errors.amount?.message}
                    {...form.register('amount', { valueAsNumber: true })}
                  />
                </FadeIn>

                <FadeIn delay={0.1}>
                  <Input
                    label="Descripción"
                    placeholder="Ej. Supermercado, Salario, Gasolina..."
                    error={form.formState.errors.description?.message}
                    {...form.register('description')}
                  />
                </FadeIn>

                <FadeIn delay={0.15}>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Cuenta</label>
                    <Select
                      onValueChange={value => form.setValue('accountId', value, { shouldDirty: true })}
                      defaultValue={form.getValues('accountId') || accounts[0]?.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.type}) - ${account.balance.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.accountId && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.accountId.message}</p>
                    )}
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Categoría</label>
                    <Select
                      onValueChange={value => form.setValue('categoryId', value, { shouldDirty: true })}
                      defaultValue={form.getValues('categoryId')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map(category => (
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
                </FadeIn>

                <FadeIn delay={0.25}>
                  <Input
                    label="Fecha"
                    type="date"
                    error={form.formState.errors.date?.message}
                    {...form.register('date')}
                  />
                </FadeIn>

                {goals.length > 0 && (
                  <FadeIn delay={0.3}>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Meta (opcional)</label>
                      <Select
                        onValueChange={value => form.setValue('goalId', value || undefined, { shouldDirty: true })}
                        defaultValue={form.getValues('goalId')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin meta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin meta</SelectItem>
                          {goals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FadeIn>
                )}

                {savingMethods.length > 0 && (
                  <FadeIn delay={0.35}>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Método de Ahorro (opcional)</label>
                      <Select
                        onValueChange={value => form.setValue('savingMethodId', value || undefined, { shouldDirty: true })}
                        defaultValue={form.getValues('savingMethodId')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin método</SelectItem>
                          {savingMethods.map(method => (
                            <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FadeIn>
                )}

                <FadeIn delay={0.4}>
                  <Input label="Notas (opcional)" placeholder="Detalles..." {...form.register('notes')} />
                </FadeIn>

                <Separator />

                <AnimatePresence mode="wait">
                  <DialogFooter>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      loading={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isEditing ? 'Guardar Cambios' : 'Crear Transacción'}
                    </motion.button>
                  </DialogFooter>
                </AnimatePresence>
              </form>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Dialog>
  )
}