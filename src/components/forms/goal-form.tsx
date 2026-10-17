'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalSchema, type GoalInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/animated'

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GoalInput) => Promise<void>
  defaultValues?: Partial<GoalInput>
  isEditing?: boolean
}

const ICONS = ['🎯', '🏖️', '🚗', '🏠', '💻', '📚', '✈️', '🎁', '🏥', '💍', '🐷', '🛡️', '🌟', '💰', '🏦']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1']

export function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
}: GoalFormProps) {
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema) as any,
    defaultValues: {
      targetAmount: 1000,
      currency: 'MXN',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      targetDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      ...defaultValues,
    },
  })

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data)
      form.reset({
        targetAmount: 1000,
        currency: 'MXN',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        targetDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting goal:', error)
    }
  }

  const watchedIcon = form.watch('icon')
  const watchedColor = form.watch('color')

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
                {isEditing ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
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
                  <Input
                    label="Nombre de la meta"
                    placeholder="Ej. Fondo de emergencia, Vacaciones, Auto nuevo..."
                    error={form.formState.errors.name?.message}
                    {...form.register('name')}
                  />
                </FadeIn>

                <FadeIn delay={0.05}>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Icono</label>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-8 gap-2"
                    >
                      {ICONS.map(icon => (
                        <motion.button
                          key={icon}
                          type="button"
                          onClick={() => form.setValue('icon', icon)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all',
                            watchedIcon === icon
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          )}
                        >
                          <span className="text-2xl">{icon}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Color</label>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-10 gap-2"
                    >
                      {COLORS.map(color => (
                        <motion.button
                          key={color}
                          type="button"
                          onClick={() => form.setValue('color', color)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'h-10 w-10 rounded-lg border-2 transition-all',
                            watchedColor === color
                              ? 'border-primary scale-110'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <Input
                    label="Descripción (opcional)"
                    placeholder="Detalles sobre la meta..."
                    {...form.register('description')}
                  />
                </FadeIn>

                <FadeIn delay={0.15}>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Monto Objetivo"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="1000"
                      error={form.formState.errors.targetAmount?.message}
                      {...form.register('targetAmount', { valueAsNumber: true })}
                    />

                    <Input
                      label="Moneda"
                      disabled
                      {...form.register('currency')}
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Fecha Inicio"
                      type="date"
                      error={form.formState.errors.startDate?.message}
                      {...form.register('startDate')}
                    />

                    <Input
                      label="Fecha Objetivo"
                      type="date"
                      error={form.formState.errors.targetDate?.message}
                      {...form.register('targetDate')}
                    />
                  </div>
                </FadeIn>

                <Separator />

                <AnimatePresence mode="wait">
                  <DialogFooter>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      loading={form.formState.isSubmitting}
                    >
                      {isEditing ? 'Guardar Cambios' : 'Crear Meta'}
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