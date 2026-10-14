import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  try {
    // Obtener cuentas
    const accounts = await prisma.financialAccount.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    })

    // Obtener categorías
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }],
    })

    // Transacciones del mes actual
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'desc' },
    })

    // Calcular totales
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const savings = transactions
      .filter(t => t.type === 'SAVING')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const balance = income - expenses

    // Metas activas
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { milestones: true },
      orderBy: { targetDate: 'asc' },
    })

    // Presupuestos del mes actual
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        periodStart: { lte: monthEnd },
        periodEnd: { gte: monthStart },
      },
      include: { category: true },
    })

    // Calcular gastado por presupuesto
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            categoryId: budget.categoryId,
            date: { gte: budget.periodStart, lte: budget.periodEnd },
          },
          _sum: { amount: true },
        })
        return {
          ...budget,
          spent: Number(spent._sum.amount || 0),
        }
      })
    )

    // Transacciones recientes (últimas 10)
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      description: t.description,
      date: t.date.toISOString(),
      category: t.category ? {
        name: t.category.name,
        icon: t.category.icon,
        color: t.category.color,
      } : null,
      account: { name: t.account.name },
    }))

    return NextResponse.json({
      income,
      expenses,
      savings,
      balance,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
      })),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
      })),
      recentTransactions,
      goals: goals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        icon: g.icon,
        color: g.color,
        targetDate: g.targetDate.toISOString(),
      })),
      budgets: budgetsWithSpent.map(b => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        spent: Number(b.spent),
        category: {
          name: b.category.name,
          icon: b.category.icon,
          color: b.category.color,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}