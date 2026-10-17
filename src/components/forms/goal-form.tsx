'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalSchema, type GoalInput } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GoalInput) => Promise<void>
  defaultValues?: Partial<GoalInput>
  isEditing?: boolean
}

const ICONS = ['🎯', '🏖️', '🚗', '🏠', '💻', '📚', '✈️', '🎁', '🏥', '💍', '🐷', '🛡️', '🌟', '💰', '🏦', '📈']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1']

const defaultGoalValues = (): Partial<GoalInput> => ({
  targetAmount: 1000,
  currency: 'MXN',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  targetDate: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
})

export function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
}: GoalFormProps) {
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema) as any,
    defaultValues: { ...defaultGoalValues(), ...defaultValues },
  })

  const watchedIcon = form.watch('icon')
  const watchedColor = form.watch('color')

  const handleSubmit = async (data: GoalInput) => {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting goal:', error)
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
                {isEditing ? 'Editar Meta' : 'Nueva Meta'}
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
              <Input
                label="Nombre de la meta"
                placeholder="Ej. Fondo de emergencia"
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Icono
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => form.setValue('icon', icon, { shouldDirty: true })}
                      className={cn(
                        'rounded-lg border-2 p-1 text-xl transition-all',
                        watchedIcon === icon
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => form.setValue('color', color, { shouldDirty: true })}
                      style={{ backgroundColor: color }}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-all',
                        watchedColor === color
                          ? 'scale-110 border-gray-900 dark:border-white'
                          : 'border-transparent'
                      )}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="Descripción (opcional)"
                placeholder="Detalles sobre la meta..."
                {...form.register('description')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monto objetivo"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="1000"
                  error={form.formState.errors.targetAmount?.message}
                  {...form.register('targetAmount', { valueAsNumber: true })}
                />
                <Input label="Moneda" disabled {...form.register('currency')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fecha inicio"
                  type="date"
                  error={form.formState.errors.startDate?.message}
                  {...form.register('startDate')}
                />
                <Input
                  label="Fecha objetivo"
                  type="date"
                  error={form.formState.errors.targetDate?.message}
                  {...form.register('targetDate')}
                />
              </div>

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
                <Button type="submit" className="flex-1" loading={form.formState.isSubmitting}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Meta'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
