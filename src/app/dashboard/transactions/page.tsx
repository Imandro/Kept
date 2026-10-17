'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionForm } from '@/components/forms/transaction-form'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, Filter, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FadeIn } from '@/components/ui/animated'
import { motion } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'TRANSFER'
  description: string
  notes: string | null
  date: string
  category?: { id: string; name: string; icon: string; color: string }
  account: { id: string; name: string }
  goal?: { id: string; name: string } | null
  savingMethod?: { id: string; name: string } | null
}

interface AccountsResponse {
  accounts: Array<{ id: string; name: string; type: string; balance: number }>
  categories: Array<{ id: string; name: string; icon: string; color: string; type: string }>
  goals: Array<{ id: string; name: string }>
  savingMethods: Array<{ id: string; name: string }>
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  SAVING: 'Ahorro',
  TRANSFER: 'Transferencia',
}

const EMPTY_FILTERS = {
  type: '',
  categoryId: '',
  accountId: '',
  startDate: '',
  endDate: '',
  search: '',
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<AccountsResponse>({
    accounts: [],
    categories: [],
    goals: [],
    savingMethods: [],
  })
  const [transactionFormOpen, setTransactionFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  useEffect(() => {
    fetchFormData()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [filters, pagination.page, searchParams.get('page')])

  const fetchFormData = async () => {
    try {
      const res = await fetch('/api/transactions/form-data')
      if (res.ok) setFormData(await res.json())
    } catch (error) {
      console.error(error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', '20')
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await fetch('/api/transactions?' + params.toString())
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setPagination(p => ({
          ...p,
          totalPages: data.pagination?.totalPages || 1,
          total: data.pagination?.total || 0,
        }))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    const url = editingTransaction ? '/api/transactions/' + editingTransaction.id : '/api/transactions'
    const method = editingTransaction ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      fetchTransactions()
      setEditingTransaction(null)
      setTransactionFormOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar?')) return
    const res = await fetch('/api/transactions/' + id, { method: 'DELETE' })
    if (res.ok) fetchTransactions()
  }

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const filterSheetContent = (
    <SheetContent side="left" className="w-80 max-w-[85vw] p-4">
      <SheetHeader>
        <SheetTitle>Filtros</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-4">
        <Input
          placeholder="Buscar..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
        />
        <Select value={filters.type} onValueChange={v => setFilters(p => ({ ...p, type: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="EXPENSE">Gastos</SelectItem>
            <SelectItem value="SAVING">Ahorros</SelectItem>
            <SelectItem value="TRANSFER">Transferencias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.categoryId} onValueChange={v => setFilters(p => ({ ...p, categoryId: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {formData.categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.accountId} onValueChange={v => setFilters(p => ({ ...p, accountId: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            {formData.accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
          />
        </div>
        <Button className="w-full" variant="outline" onClick={clearFilters}>
          Limpiar
        </Button>
      </div>
    </SheetContent>
  )

  return (
    <>
      <TransactionForm
        key={editingTransaction?.id ?? 'new'}
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleSubmit}
        accounts={formData.accounts}
        categories={formData.categories}
        goals={formData.goals}
        savingMethods={formData.savingMethods}
        defaultValues={
          editingTransaction
            ? {
                amount: editingTransaction.amount,
                type: editingTransaction.type,
                description: editingTransaction.description,
                notes: editingTransaction.notes || undefined,
                date: editingTransaction.date.split('T')[0],
                accountId: editingTransaction.account.id,
                categoryId: editingTransaction.category?.id,
                goalId: editingTransaction.goal?.id,
                savingMethodId: editingTransaction.savingMethod?.id,
              }
            : undefined
        }
        isEditing={!!editingTransaction}
      />

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        {filterSheetContent}

        <div className="p-4 space-y-4">
          <FadeIn>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Transacciones</h1>
              <div className="flex gap-2">
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Filter className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <Button
                  onClick={() => {
                    setEditingTransaction(null)
                    setTransactionFormOpen(true)
                  }}
                  className="h-10 px-4"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </FadeIn>

        {loading && (
          <FadeIn>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {!loading && transactions.length === 0 && (
          <FadeIn>
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Sin transacciones</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setEditingTransaction(null)
                    setTransactionFormOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear primera
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {!loading && transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <Link href={'/dashboard/transactions/' + tx.id} className="block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          tx.type === 'INCOME' && 'bg-green-100 text-green-600',
                          tx.type === 'EXPENSE' && 'bg-red-100 text-red-600',
                          tx.type === 'SAVING' && 'bg-purple-100 text-purple-600',
                          tx.type === 'TRANSFER' && 'bg-blue-100 text-blue-600'
                        )}
                      >
                        {tx.category?.icon && (
                          <span style={{ color: tx.category.color }} className="text-xl">
                            {tx.category.icon}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {tx.category?.name} · {tx.account.name} · {formatDate(tx.date, 'short')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'font-medium text-right',
                        tx.type === 'INCOME' && 'text-green-600',
                        tx.type === 'EXPENSE' && 'text-red-600',
                        tx.type === 'SAVING' && 'text-purple-600',
                        tx.type === 'TRANSFER' && 'text-blue-600'
                      )}
                    >
                      {tx.type === 'EXPENSE' && '−'}
                      {tx.type === 'INCOME' && '+'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <Badge variant="secondary" className="text-xs">
                    {TYPE_LABELS[tx.type]}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTransaction(tx)
                        setTransactionFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => handleDelete(tx.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <FadeIn delay={0.1}>
            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </FadeIn>
        )}
        </div>
      </Sheet>
    </>
  )
}
