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
  BarChart3,
  Clock,
  CheckCircle,
  Flag,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  FadeIn, 
  SlideUp, 
  ScaleIn, 
  StaggerContainer, 
  StaggerItem,
  Skeleton 
} from '@/components/ui/animated'
import { motion } from 'framer-motion'

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
    milestones: Array<{ name: string; amount: number; isCompleted: boolean }>
  }>
  budgets: Array<{
    id: string
    name: string
    amount: number
    spent: number
    category: { name: string; icon: string; color: string }
  }>
}

export default function DashboardPage() {
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

        <div className="space-y-6 p-4">
          <FadeIn>
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="120" height="24" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
                </Card>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <Skeleton variant="text" width="80" height="20" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="circular" width="40" height="40" />
                      <div className="space-y-1">
                        <Skeleton variant="text" width="80" height="16" />
                        <Skeleton variant="text" width="60" height="12" />
                      </div>
                    </div>
                    <Skeleton variant="text" width="80" height="20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

    )
  }

  const balanceColor = summary && summary.balance >= 0 ? 'text-green-600' : 'text-red-600'

  return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kept</h1>
              <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
            </div>
            <Button onClick={() => setTransactionFormOpen(true)} className="h-10 px-4">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </FadeIn>

        {/* Balance Cards */}
        <FadeIn delay={0.1}>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Balance</p>
                    <p className={cn('text-3xl font-bold mt-1', balanceColor)}>{formatCurrency(summary?.balance || 0)}</p>
                  </div>
                  <TrendingUp className={cn('h-6 w-6', balanceColor)} />
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(summary?.income || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gastos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(summary?.expenses || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ahorrado</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(summary?.savings || 0)}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </FadeIn>

        {/* Cuentas */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Cuentas</CardTitle>
              <Link href="/settings/accounts" className="text-xs text-primary">Ver todas</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <StaggerContainer stagger={0.05}>
                {summary?.accounts.map(account => (
                  <StaggerItem key={account.id}>
                    <Link
                      href={`/settings/accounts/${account.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-right">{formatCurrency(account.balance)}</p>
                    </Link>
                  </StaggerItem>
                ))}
                {!summary?.accounts.length && <p className="text-center text-gray-500 py-4 text-sm">Sin cuentas</p>}
              </StaggerContainer>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Metas */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Metas</CardTitle>
              <Link href="/dashboard/goals" className="text-xs text-primary">Ver todas</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <StaggerContainer stagger={0.05}>
                {summary?.goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isOverdue = daysLeft < 0
                  return (
                    <StaggerItem key={goal.id}>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg leading-none" style={{ backgroundColor: `${goal.color}15`, color: goal.color || undefined }}>
                              {goal.icon || '🎯'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{goal.name}</p>
                              <p className="text-xs text-gray-500">{isOverdue ? 'Vencida' : `${daysLeft} días`}</p>
                            </div>
                          </div>
                          <Badge variant={isOverdue ? 'destructive' : progress >= 100 ? 'success' : 'default'} className="text-xs">
                            {Math.min(Math.round(progress), 100)}%
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: goal.color || '#3b82f6' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                          {goal.milestones.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Flag className="h-3 w-3" />
                              {goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length}
                            </span>
                          )}
                        </div>
                      </div>
                      </StaggerItem>
                    )
                  })}
                  {!summary?.goals.length && (
                    <div className="text-center py-6">
                      <Target className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Sin metas activas</p>
                      <Button asChild className="mt-2" size="sm">
                        <Link href="/dashboard/goals/new">Crear meta</Link>
                      </Button>
                    </div>
                  )}
              </StaggerContainer>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Transacciones Recientes */}
        <FadeIn delay={0.4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recientes</CardTitle>
              <Link href="/dashboard/transactions" className="text-xs text-primary">Ver todas</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <StaggerContainer stagger={0.05}>
                {summary?.recentTransactions.slice(0, 5).map(tx => (
                  <StaggerItem key={tx.id}>
                    <Link
                      href={`/dashboard/transactions/${tx.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          tx.type === 'INCOME' && 'bg-green-100 text-green-600',
                          tx.type === 'EXPENSE' && 'bg-red-100 text-red-600',
                          tx.type === 'SAVING' && 'bg-purple-100 text-purple-600',
                          tx.type === 'TRANSFER' && 'bg-blue-100 text-blue-600'
                        )}>
                          {tx.category?.icon && <span style={{ color: tx.category.color }} className="text-xl">{tx.category.icon}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                          <p className="text-xs text-gray-500 truncate">{tx.category?.name} · {tx.account.name} · {formatDate(tx.date, 'short')}</p>
                        </div>
                      </div>
                      <div className={cn('font-medium text-right',
                        tx.type === 'INCOME' && 'text-green-600',
                        tx.type === 'EXPENSE' && 'text-red-600',
                        tx.type === 'SAVING' && 'text-purple-600',
                        tx.type === 'TRANSFER' && 'text-blue-600'
                      )}>
                        {tx.type === 'EXPENSE' && '−'}
                        {tx.type === 'INCOME' && '+'}
                        {formatCurrency(tx.amount)}
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
                {!summary?.recentTransactions.length && <p className="text-center text-gray-500 py-4 text-sm">Sin transacciones</p>}
              </StaggerContainer>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Presupuestos */}
        <FadeIn delay={0.5}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Presupuestos</CardTitle>
              <Link href="/dashboard/budgets" className="text-xs text-primary">Ver todos</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <StaggerContainer stagger={0.05}>
                {summary?.budgets.map(budget => {
                  const percentage = (budget.spent / budget.amount) * 100
                  const isOver = percentage > 100
                  const isWarning = percentage > 80
                  return (
                    <StaggerItem key={budget.id}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span style={{ color: budget.category.color }} className="text-xl">{budget.category.icon}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{budget.category.name}</span>
                          </div>
                          <span className={cn('text-sm font-medium', isOver && 'text-red-600', isWarning && !isOver && 'text-amber-600')}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            className={cn('h-full rounded-full transition-all',
                              isOver && 'bg-red-500',
                              isWarning && !isOver && 'bg-amber-500',
                              !isWarning && !isOver && `bg-[${budget.category.color}]`
                            )}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1">{Math.round(percentage)}%</p>
                      </div>
                      </StaggerItem>
                    )
                  })}
                  {!summary?.budgets.length && <p className="text-center text-gray-500 py-4 text-sm">Sin presupuestos</p>}
              </StaggerContainer>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
  )
}