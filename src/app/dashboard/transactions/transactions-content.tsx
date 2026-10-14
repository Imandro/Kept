'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionForm } from '@/components/forms/transaction-form'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

export default function TransactionsContent() {
  const router = useRouter()
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
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    accountId: '',
    startDate: '',
    endDate: '',
    search: '',
  })

  // Cargar datos iniciales
  useEffect(() => {
    fetchFormData()
    fetchTransactions()
  }, [filters, searchParams.get('page')])

  const fetchFormData = async () => {
    try {
      const res = await fetch('/api/transactions/form-data')
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
      }
    } catch (error) {
      console.error('Error fetching form data:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', '20')
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      
      const res = await fetch(`/api/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        }))
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSubmit = async (data: any) => {
    const url = editingTransaction 
      ? `/api/transactions/${editingTransaction.id}`
      : '/api/transactions'
    const method = editingTransaction ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (res.ok) {
      fetchTransactions()
      setEditingTransaction(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return
    
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) fetchTransactions()
  }

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setTransactionFormOpen(true)
  }

  const typeColors = {
    INCOME: 'bg-green-100 text-green-800',
    EXPENSE: 'bg-red-100 text-red-800',
    SAVING: 'bg-purple-100 text-purple-800',
    TRANSFER: 'bg-blue-100 text-blue-800',
  }

  const typeLabels = {
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
    SAVING: 'Ahorro',
    TRANSFER: 'Transferencia',
  }

  return (
    <>
      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleTransactionSubmit}
        accounts={formData.accounts}
        categories={formData.categories}
        goals={formData.goals}
        savingMethods={formData.savingMethods}
        defaultValues={editingTransaction ? {
          amount: editingTransaction.amount,
          type: editingTransaction.type,
          description: editingTransaction.description,
          notes: editingTransaction.notes || undefined,
          date: editingTransaction.date.split('T')[0],
          accountId: editingTransaction.account.id,
          categoryId: editingTransaction.category?.id,
          goalId: editingTransaction.goal?.id,
          savingMethodId: editingTransaction.savingMethod?.id,
        } : undefined}
        isEditing={!!editingTransaction}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
            <p className="text-gray-500">Gestiona tus ingresos, gastos y ahorros</p>
          </div>
          <Button onClick={() => { setEditingTransaction(null); setTransactionFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descripción..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filters.type}
                onValueChange={value => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="INCOME">Ingresos</SelectItem>
                  <SelectItem value="EXPENSE">Gastos</SelectItem>
                  <SelectItem value="SAVING">Ahorros</SelectItem>
                  <SelectItem value="TRANSFER">Transferencias</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.categoryId}
                onValueChange={value => setFilters(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
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

              <Select
                value={filters.accountId}
                onValueChange={value => setFilters(prev => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {formData.accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Desde"
                  value={filters.startDate}
                  onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-[160px]"
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  value={filters.endDate}
                  onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-[160px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de transacciones */}
        <Card>
          <CardContent className="pt-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No hay transacciones</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/transactions/new">Crear la primera</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="w-[140px]">Categoría</TableHead>
                        <TableHead className="w-[140px]">Cuenta</TableHead>
                        <TableHead className="w-[100px] text-right">Monto</TableHead>
                        <TableHead className="w-[100px]">Tipo</TableHead>
                        <TableHead className="w-[60px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(tx.date, 'short')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                              {tx.notes && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{tx.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.category && (
                              <span className="flex items-center gap-1">
                                <span style={{ color: tx.category.color }}>{tx.category.icon}</span>
                                <span className="text-sm">{tx.category.name}</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{tx.account.name}</TableCell>
                          <TableCell className={cn('font-medium text-right', 
                            tx.type === 'INCOME' && 'text-green-600',
                            tx.type === 'EXPENSE' && 'text-red-600',
                            tx.type === 'SAVING' && 'text-purple-600',
                            tx.type === 'TRANSFER' && 'text-blue-600'
                          )}>
                            {tx.type === 'EXPENSE' && '-'}
                            {tx.type === 'INCOME' && '+'}
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.type.toLowerCase() as any}>
                              {typeLabels[tx.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(tx)}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-700">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-gray-500">
                      Mostrando {((pagination.page - 1) * 20) + 1} a {Math.min(pagination.page * 20, pagination.total)} de {pagination.total}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}