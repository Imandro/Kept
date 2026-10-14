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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Meta' : 'Nueva Meta de Ahorro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Input
            label="Nombre de la meta"
            placeholder="Ej. Fondo de emergencia, Vacaciones, Auto nuevo..."
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue('icon', icon)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    watchedIcon === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <div className="grid grid-cols-10 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue('color', color)}
                  className={cn(
                    'h-10 w-10 rounded-lg border-2 transition-all',
                    watchedColor === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Input
            label="Descripción (opcional)"
            placeholder="Detalles sobre la meta..."
            {...form.register('description')}
          />

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

          <Separator />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}