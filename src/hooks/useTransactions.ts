import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db, generateLocalId, OfflineTransaction } from '@/lib/db'
import { queueCreate, queueUpdate, queueDelete, processSyncQueue } from '@/lib/sync'

const API_BASE = '/api/transactions'

// Types
export interface TransactionInput {
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'TRANSFER'
  description: string
  notes?: string
  date: string
  accountId: string
  categoryId?: string
  goalId?: string
  savingMethodId?: string
  tags?: string[]
  location?: string
}

export interface Transaction extends TransactionInput {
  id: string
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string; icon: string; color: string }
  account: { id: string; name: string }
  goal?: { id: string; name: string } | null
  savingMethod?: { id: string; name: string } | null
}

// Fetch con cache offline-first
export function useTransactions(params?: {
  page?: number; limit?: number; type?: string; categoryId?: string;
  accountId?: string; startDate?: string; endDate?: string; search?: string
}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      Object.entries(params || {}).forEach(([k, v]) => v && searchParams.set(k, String(v)))
      
      const res = await fetch(`${API_BASE}?${searchParams}`)
      if (!res.ok) throw new Error('Error fetching transactions')
      return res.json()
    },
    placeholderData: (prev) => prev, // Keep previous data while fetching
  })
}

// Create mutation (optimistic + offline queue)
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: TransactionInput) => {
      const localId = await generateLocalId()
      const optimisticTx: OfflineTransaction = {
        localId,
        amount: data.amount,
        type: data.type,
        description: data.description,
        notes: data.notes,
        date: data.date,
        accountId: data.accountId,
        categoryId: data.categoryId,
        goalId: data.goalId,
        savingMethodId: data.savingMethodId,
        tags: data.tags || [],
        location: data.location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
        pending: true,
        deleted: false,
      }

      // Guardar en IndexedDB inmediatamente
      await db.transactions.add(optimisticTx)
      await queueCreate('transaction', optimisticTx)

      // Optimistic update en React Query
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          transactions: [optimisticTx, ...old.transactions],
          pagination: { ...old.pagination, total: old.pagination.total + 1 }
        }
      })

      // Intentar sync inmediato si online
      if (navigator.onLine) {
        try {
          await processSyncQueue()
        } catch {}
      }

      return optimisticTx
    },
    onError: (err, vars, context) => {
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// Update mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionInput> }) => {
      // Actualizar en IndexedDB
      await db.transactions.update(id as any, { ...data, updatedAt: new Date().toISOString(), pending: true })
      await queueUpdate('transaction', { localId: id, ...data } as any)

      // Optimistic update
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          transactions: old.transactions.map((tx: any) => 
            tx.localId === id || tx.id === id ? { ...tx, ...data, updatedAt: new Date().toISOString() } : tx
          )
        }
      })

      if (navigator.onLine) await processSyncQueue()
    },
  })
}

// Delete mutation
export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete en IndexedDB
      await db.transactions.update(id as any, { deleted: true, pending: true })
      await queueDelete('transaction', id)

      // Optimistic update
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          transactions: old.transactions.filter((tx: any) => tx.localId !== id && tx.id !== id),
          pagination: { ...old.pagination, total: old.pagination.total - 1 }
        }
      })

      if (navigator.onLine) await processSyncQueue()
    },
  })
}

// Hook para sync status
export function useSyncStatus() {
  return useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const pending = await db.syncQueue.count()
      const unsyncedTx = await db.transactions.where('synced').equals(false as any).count()
      return { pending, unsyncedTx, isOnline: navigator.onLine }
    },
    refetchInterval: 5000,
  })
}