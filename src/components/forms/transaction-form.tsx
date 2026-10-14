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
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo</label>
            <Select
              onValueChange={value => form.setValue('type', value as TransactionInput['type'], { shouldDirty: true })}
              defaultValue={form.getValues('type')}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">💰 Ingreso</SelectItem>
                <SelectItem value="EXPENSE">💸 Gasto</SelectItem>
                <SelectItem value="SAVING">🐷 Ahorro</SelectItem>
                <SelectItem value="TRANSFER">🔄 Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input label="Monto" type="number" step="0.01" min="0.01" placeholder="0.00"
            error={form.formState.errors.amount?.message}
            {...form.register('amount', { valueAsNumber: true })} />

          <Input label="Descripción" placeholder="Ej. Supermercado, Salario..."
            error={form.formState.errors.description?.message}
            {...form.register('description')} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Cuenta</label>
            <Select
              onValueChange={value => form.setValue('accountId', value, { shouldDirty: true })}
              defaultValue={form.getValues('accountId') || accounts[0]?.id}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.type}) - ${acc.balance.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.accountId && <p className="mt-1 text-sm text-red-600">{form.formState.errors.accountId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Categoría</label>
            <Select
              onValueChange={value => form.setValue('categoryId', value, { shouldDirty: true })}
              defaultValue={form.getValues('categoryId')}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-2"><span style={{color:cat.color}}>{cat.icon}</span>{cat.name}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input label="Fecha" type="date" error={form.formState.errors.date?.message} {...form.register('date')} />

          {goals.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Meta (opcional)</label>
              <Select
                onValueChange={value => form.setValue('goalId', value || undefined, { shouldDirty: true })}
                defaultValue={form.getValues('goalId')}
              >
                <SelectTrigger><SelectValue placeholder="Sin meta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin meta</SelectItem>
                  {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {savingMethods.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Método de Ahorro (opcional)</label>
              <Select
                onValueChange={value => form.setValue('savingMethodId', value || undefined, { shouldDirty: true })}
                defaultValue={form.getValues('savingMethodId')}
              >
                <SelectTrigger><SelectValue placeholder="Sin método" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin método</SelectItem>
                  {savingMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <Input label="Notas (opcional)" placeholder="Detalles..." {...form.register('notes')} />

          <Separator />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}