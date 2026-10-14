'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionForm } from '@/components/forms/transaction-form'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  PiggyBank, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  Calendar,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Tipos
interface FinancialSummary {
  income: number
  expenses: number
  savings: number
  balance: number
  accounts: Array<{ id: string; name: string; type: string; balance: number }>
  categories: Array<{ id: string; name: string; icon: string; color: string; type: string }>
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    description: string
    date: string
    category?: { name: string; icon: string; color: string }
    account: { name: string }
  }>
  goals: Array<{
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    icon: string
    color: string
    targetDate: string
  }>
  budgets: Array<{
    id: string
    name: string
    amount: number
    spent: number
    category: { name: string; icon: string; color: string }
  }>
}

export default function DashboardContent() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactionFormOpen, setTransactionFormOpen] = useState(false)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary')
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSubmit = async (data: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      fetchSummary()
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const balanceColor = summary && summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
  const balanceIcon = summary && summary.balance >= 0 ? TrendingUp : TrendingDown

  return (
    <>
      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleTransactionSubmit}
        accounts={summary?.accounts || []}
        categories={summary?.categories || []}
        goals={summary?.goals || []}
      />

      {/* Header con botón nueva transacción */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}
          </p>
        </div>
        <Button onClick={() => setTransactionFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Transacción
        </Button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos</CardTitle>
            <Wallet className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.income || 0)}
            </div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gastos</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.expenses || 0)}
            </div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', balanceColor)}>
              {formatCurrency(summary?.balance || 0)}
            </div>
            <p className="text-xs text-gray-500">Ingresos - Gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ahorrado</CardTitle>
            <PiggyBank className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary?.savings || 0)}
            </div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel izquierdo: Cuentas y Metas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cuentas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cuentas</CardTitle>
              <Link href="/settings/accounts" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.accounts.map(account => (
                  <Link
                    key={account.id}
                    href={`/settings/accounts/${account.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', 
                        account.type === 'checking' && 'bg-blue-100 text-blue-600',
                        account.type === 'savings' && 'bg-purple-100 text-purple-600',
                        account.type === 'cash' && 'bg-green-100 text-green-600',
                        account.type === 'investment' && 'bg-yellow-100 text-yellow-600',
                        account.type === 'crypto' && 'bg-orange-100 text-orange-600'
                      )}>
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </Link>
                ))}
                {!summary?.accounts.length && (
                  <p className="text-center text-gray-500 py-4">No hay cuentas configuradas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metas de Ahorro</CardTitle>
              <Link href="/dashboard/goals" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isOverdue = daysLeft < 0
                  
                  return (
                    <div key={goal.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', 
                            `bg-[${goal.color}]20 text-[${goal.color}]`
                          )}>
                            {goal.icon && <span className="text-lg">{goal.icon}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{goal.name}</p>
                            <p className="text-xs text-gray-500">{isOverdue ? `${Math.abs(daysLeft)} días vencida` : `${daysLeft} días restantes`}</p>
                          </div>
                        </div>
                        <Badge variant={isOverdue ? 'destructive' : progress >= 100 ? 'success' : 'info'}>
                          {isOverdue ? 'Vencida' : progress >= 100 ? 'Completada' : 'En progreso'}
                        </Badge>
                      </div>

                      {/* Progreso principal */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                          <span className={cn('font-bold', progress >= 100 ? 'text-green-600' : `text-[${goal.color}]`)}>
                            {Math.min(Math.round(progress), 100)}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', 
                              progress >= 100 ? 'bg-green-500' : `bg-[${goal.color}]`
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                        <span>{Math.round(progress)}% completado</span>
                      </div>
                    </div>
                  )
                })}
                {!summary?.goals.length && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay metas activas</p>
                    <Button asChild className="mt-3">
                      <Link href="/dashboard/goals/new">Crear tu primera meta</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Transacciones recientes y Presupuestos */}
        <div className="space-y-6">
          {/* Transacciones recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transacciones Recientes</CardTitle>
              <Link href="/dashboard/transactions" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.recentTransactions.slice(0, 5).map(tx => (
                  <Link
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        tx.type === 'INCOME' && 'bg-green-100 text-green-600',
                        tx.type === 'EXPENSE' && 'bg-red-100 text-red-600',
                        tx.type === 'SAVING' && 'bg-purple-100 text-purple-600',
                        tx.type === 'TRANSFER' && 'bg-blue-100 text-blue-600'
                      )}>
                        {tx.category?.icon && <span style={{ color: tx.category.color }}>{tx.category.icon}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {tx.category?.name} • {tx.account.name} • {formatDate(tx.date, 'short')}
                        </p>
                      </div>
                    </div>
                    <div className={cn('text-right font-medium', 
                      tx.type === 'INCOME' && 'text-green-600',
                      tx.type === 'EXPENSE' && 'text-red-600',
                      tx.type === 'SAVING' && 'text-purple-600',
                      tx.type === 'TRANSFER' && 'text-blue-600'
                    )}>
                      {tx.type === 'EXPENSE' && '-'}
                      {tx.type === 'INCOME' && '+'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </Link>
                ))}
                {!summary?.recentTransactions.length && (
                  <p className="text-center text-gray-500 py-4">No hay transacciones recientes</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Presupuestos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Presupuestos del Mes</CardTitle>
              <Link href="/dashboard/budgets" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.budgets.map(budget => {
                  const percentage = (budget.spent / budget.amount) * 100
                  const isOver = percentage > 100
                  const isWarning = percentage > 80
                  return (
                    <div key={budget.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span style={{ color: budget.category.color }}>{budget.category.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{budget.category.name}</span>
                        </div>
                        <span className={cn('text-sm font-medium', isOver && 'text-red-600', isWarning && !isOver && 'text-yellow-600')}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all',
                            isOver && 'bg-red-500',
                            isWarning && !isOver && 'bg-yellow-500',
                            !isWarning && !isOver && `bg-[${budget.category.color}]`
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-right mt-1">{Math.round(percentage)}% utilizado</p>
                    </div>
                  )
                })}
                {!summary?.budgets.length && (
                  <p className="text-center text-gray-500 py-4">No hay presupuestos configurados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}