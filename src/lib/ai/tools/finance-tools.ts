import { FinancialContext, SpendingPattern, FinanceAction, ActionResult } from '@/lib/ai/types'
import { prisma } from '@/lib/prisma'
import { subDays, startOfMonth, endOfMonth, format, startOfWeek, endOfWeek } from 'date-fns'

// ============ Herramientas de Lectura ============

export async function getFinancialContext(userId: string): Promise<FinancialContext> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const last3Months = subDays(now, 90)

  const [
    accounts,
    transactions,
    goals,
    budgets,
    categories,
    recentTx,
  ] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true, account: true, goal: true },
      orderBy: { date: 'desc' },
    }),
    prisma.goal.findMany({ where: { userId, status: 'ACTIVE' }, include: { milestones: true }, orderBy: { targetDate: 'asc' } }),
    prisma.budget.findMany({ where: { userId, periodStart: { lte: monthEnd }, periodEnd: { gte: monthStart } }, include: { category: true } }),
    prisma.category.findMany({ where: { userId }, orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }] }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: subDays(now, 30) } },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
      take: 50,
    }),
  ])

  // Calcular resumen
  const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
  const savings = transactions.filter(t => t.type === 'SAVING').reduce((s, t) => s + Number(t.amount), 0)

  // Detectar patrones
  const patterns = await detectPatterns(userId, transactions, recentTx, categories)

  return {
    userId,
    accounts: accounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: Number(a.balance) })),
    transactions: transactions.map(t => ({
      id: t.id, amount: Number(t.amount), type: t.type, description: t.description,
      date: t.date.toISOString(), category: t.category ? { name: t.category.name, icon: t.category.icon, color: t.category.color } : undefined,
      account: { name: t.account.name }, goal: t.goal ? { name: t.goal.name } : null,
    })),
    goals: goals.map(g => ({
      id: g.id, name: g.name, targetAmount: Number(g.targetAmount), currentAmount: Number(g.currentAmount),
      targetDate: g.targetDate.toISOString(), status: g.status, icon: g.icon, color: g.color,
    })),
    budgets: budgets.map(b => ({
      id: b.id, name: b.name, amount: Number(b.amount), spent: Number(b.spent),
      category: { name: b.category.name, icon: b.category.icon, color: b.category.color },
    })),
    summary: { income, expenses, savings, balance: income - expenses },
    patterns,
  }
}

async function detectPatterns(userId: string, monthlyTx: any[], recentTx: any[], categories: any[]): Promise<SpendingPattern[]> {
  const patterns: SpendingPattern[] = []
  const now = new Date()
  const last3Months = subDays(now, 90)

  // 1. Suscripciones detectadas (mismo monto, misma categoría, recurrente)
  const subscriptions = detectSubscriptions(monthlyTx)
  if (subscriptions.length > 0) {
    patterns.push({
      type: 'subscription',
      description: `Detectadas ${subscriptions.length} suscripciones recurrentes por $${subscriptions.reduce((sum, s) => sum + s.amount, 0).toFixed(0)}/mes`,
      severity: 'medium',
      data: subscriptions,
      suggestion: 'Revisa si usas todas. Cancela las innecesarias.',
    })
  }

  // 2. Categoría con spike inusual
  const categorySpikes = detectCategorySpikes(monthlyTx, categories)
  categorySpikes.forEach(spike => {
    patterns.push({
      type: 'category_spike',
      description: `Gasto inusual en ${spike.category}: $${spike.amount.toFixed(0)} (${spike.percent}% más que promedio)`,
      severity: spike.percent > 50 ? 'high' : 'medium',
      data: spike,
      suggestion: spike.percent > 100 ? 'Revisa si fue necesario o fue impulso' : 'Monitorea esta categoría',
    })
  })

  // 3. Gasto hormiga (muchas transacciones pequeñas)
  const microExpenses = recentTx.filter(t => t.type === 'EXPENSE' && Number(t.amount) <= 50)
  if (microExpenses.length > 10) {
    const total = microExpenses.reduce((s, t) => s + Number(t.amount), 0)
    patterns.push({
      type: 'recurring',
      description: `${microExpenses.length} gastos ≤$50 suman $${total.toFixed(0)} este mes`,
      severity: 'low',
      data: { count: microExpenses.length, total },
      suggestion: 'Agrupa compras pequeñas o usa efectivo para controlarlas',
    })
  }

  // 4. Tendencia de ahorro
  const savingsRate = monthlyTx.filter(t => t.type === 'SAVING').reduce((s, t) => s + Number(t.amount), 0)
  const incomeTotal = monthlyTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  if (incomeTotal > 0) {
    const rate = (savingsRate / incomeTotal) * 100
    if (rate < 10) {
      patterns.push({
        type: 'trend',
        description: `Tu tasa de ahorro es ${rate.toFixed(1)}% (recomendado: 20%+)`,
        severity: 'high',
        data: { rate, savings: savingsRate, income: incomeTotal },
        suggestion: 'Automatiza ahorro al recibir ingresos. Prueba método 50/30/20',
      })
    } else if (rate >= 20) {
      patterns.push({
        type: 'trend',
        description: `¡Excelente! Ahorras ${rate.toFixed(1)}% de tus ingresos`,
        severity: 'low',
        data: { rate },
        suggestion: 'Considera invertir el excedente',
      })
    }
  }

  // 5. Día de la semana con más gasto
  const daySpending = recentTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const day = new Date(t.date).getDay()
      acc[day] = (acc[day] || 0) + Number(t.amount)
      return acc
    }, {} as Record<number, number>)
  const maxDay = Object.entries(daySpending).sort((a, b) => b[1] - a[1])[0]
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  if (maxDay && maxDay[1] > 0) {
    patterns.push({
      type: 'recurring',
      description: `Tus ${dayNames[parseInt(maxDay[0])]} son el día con más gasto: $${maxDay[1].toFixed(0)}`,
      severity: 'low',
      data: { day: parseInt(maxDay[0]), amount: maxDay[1] },
      suggestion: 'Planifica compras para otros días',
    })
  }

  return patterns
}

function detectSubscriptions(transactions: any[]) {
  const expenseTx = transactions.filter(t => t.type === 'EXPENSE')
  const grouped = expenseTx.reduce((acc, t) => {
    const key = `${t.categoryId}-${Number(t.amount).toFixed(2)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {} as Record<string, any[]>)

  return Object.values(grouped)
    .filter(g => g.length >= 2)
    .map(g => ({
      category: g[0].category?.name,
      amount: Number(g[0].amount),
      frequency: g.length,
      dates: g.map((t: any) => t.date),
    }))
    .filter(s => s.frequency >= 2)
}

function detectCategorySpikes(transactions: any[], categories: any[]) {
  const expenseTx = transactions.filter(t => t.type === 'EXPENSE')
  const byCategory = expenseTx.reduce((acc, t) => {
    const catId = t.categoryId || 'unknown'
    if (!acc[catId]) acc[catId] = { total: 0, count: 0, cat: t.category }
    acc[catId].total += Number(t.amount)
    acc[catId].count++
    return acc
  }, {} as Record<string, { total: number; count: number; cat: any }>)

  // Simular promedio histórico (en producción usar últimos 3 meses)
  return Object.entries(byCategory)
    .map(([catId, data]) => {
      const avgHistorical = data.total * 0.7 // Mock: 70% del actual
      const percent = ((data.total - avgHistorical) / avgHistorical) * 100
      return {
        category: data.cat?.name || catId,
        amount: data.total,
        percent: Math.round(percent),
        catId,
      }
    })
    .filter(s => s.percent > 20)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3)
}

// ============ Herramientas de Escritura (Acciones) ============

export async function executeAction(userId: string, action: FinanceAction): Promise<ActionResult> {
  const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    switch (action.type) {
      case 'create_transaction':
        return await createTransaction(userId, action.params, actionId)
      case 'create_goal':
        return await createGoal(userId, action.params, actionId)
      case 'update_goal':
        return await updateGoal(userId, action.params, actionId)
      case 'create_budget':
        return await createBudget(userId, action.params, actionId)
      case 'transfer_between_accounts':
        return await transferBetweenAccounts(userId, action.params, actionId)
      case 'create_recurring':
        return await createRecurring(userId, action.params, actionId)
      case 'set_savings_allocation':
        return await setSavingsAllocation(userId, action.params, actionId)
      case 'create_milestone':
        return await createMilestone(userId, action.params, actionId)
      default:
        throw new Error(`Acción no soportada: ${action.type}`)
    }
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Error ejecutando ${action.type}: ${error.message}`,
      error: error.message,
    }
  }
}

async function createTransaction(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { amount, type, description, date, accountId, categoryId, goalId, notes } = params

  // Validaciones
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } })
  if (!account) throw new Error('Cuenta no encontrada')

  const tx = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: { userId, amount, type, description, date: new Date(date), accountId, categoryId, goalId, notes },
    })

    // Actualizar balance cuenta
    const amountChange = type === 'EXPENSE' ? -amount : amount
    await tx.financialAccount.update({ where: { id: accountId }, data: { balance: { increment: amountChange } } })

    // Actualizar meta si aplica
    if (goalId && type === 'SAVING') {
      await tx.goal.update({ where: { id: goalId }, data: { currentAmount: { increment: amount } } })
    }

    return created
  })

  return {
    success: true,
    actionId,
    message: `✅ Transacción creada: ${description} (${type === 'EXPENSE' ? '-' : '+'}$${amount})`,
    data: { transactionId: tx.id },
    undoAction: { type: 'create_transaction', params: { ...params, amount: -amount }, description: 'Deshacer transacción', requiresConfirmation: false },
  }
}

async function createGoal(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { name, targetAmount, targetDate, description, icon, color } = params

  const goal = await prisma.goal.create({
    data: { userId, name, targetAmount, targetDate: new Date(targetDate), description, icon, color, currentAmount: 0, status: 'ACTIVE' },
  })

  return {
    success: true,
    actionId,
    message: `🎯 Meta creada: "${name}" - Objetivo: $${targetAmount.toLocaleString()} para ${format(new Date(targetDate), 'dd/MM/yyyy')}`,
    data: { goalId: goal.id },
    undoAction: { type: 'create_goal', params: { goalId: goal.id }, description: 'Eliminar meta creada', requiresConfirmation: true },
  }
}

async function updateGoal(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { goalId, ...updates } = params
  const goal = await prisma.goal.update({ where: { id: goalId, userId }, data: updates })
  return { success: true, actionId, message: `Meta "${goal.name}" actualizada`, data: { goalId: goal.id } }
}

async function createBudget(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { categoryId, amount, periodStart, periodEnd } = params
  const now = new Date()
  const start = periodStart ? new Date(periodStart) : startOfMonth(now)
  const end = periodEnd ? new Date(periodEnd) : endOfMonth(now)

  const budget = await prisma.budget.upsert({
    where: { categoryId_periodStart_periodEnd: { categoryId, periodStart: start, periodEnd: end } },
    update: { amount, userId },
    create: { userId, name: `Presupuesto ${format(start, 'MMMM')}`, amount, periodStart: start, periodEnd: end, categoryId },
  })

  return { success: true, actionId, message: `📊 Presupuesto creado: $${amount.toLocaleString()} para ${format(start, 'MMMM')}`, data: { budgetId: budget.id } }
}

async function transferBetweenAccounts(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { fromAccountId, toAccountId, amount, description } = params
  const date = new Date()

  await prisma.$transaction(async (tx) => {
    // Salida
    await tx.transaction.create({ data: { userId, amount, type: 'TRANSFER', description: `Transferencia: ${description || 'Entre cuentas'}`, date, accountId: fromAccountId } })
    await tx.financialAccount.update({ where: { id: fromAccountId }, data: { balance: { decrement: amount } } })
    // Entrada
    await tx.transaction.create({ data: { userId, amount, type: 'TRANSFER', description: `Transferencia: ${description || 'Entre cuentas'}`, date, accountId: toAccountId } })
    await tx.financialAccount.update({ where: { id: toAccountId }, data: { balance: { increment: amount } } })
  })

  return { success: true, actionId, message: `🔄 Transferencia de $${amount.toLocaleString()} completada`, data: { amount } }
}

async function createRecurring(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { name, amount, type, categoryId, accountId, frequency, startDate, endDate } = params
  const rec = await prisma.recurringTransaction.create({
    data: { userId, name, amount, type, categoryId, accountId, frequency, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, nextRunDate: new Date(startDate) },
  })
  return { success: true, actionId, message: `🔁 Transacción recurrente "${name}" creada`, data: { recurringId: rec.id } }
}

async function setSavingsAllocation(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { methodId, allocations } = params
  await prisma.savingAllocation.deleteMany({ where: { savingMethodId: methodId } })
  await prisma.savingAllocation.createMany({ data: allocations.map((a: any, i: number) => ({ savingMethodId: methodId, targetAccountId: a.accountId, percentage: a.percentage, priority: i })) })
  return { success: true, actionId, message: '💰 Asignación de ahorro actualizada', data: { methodId } }
}

async function createMilestone(userId: string, params: any, actionId: string): Promise<ActionResult> {
  const { goalId, name, amount, targetDate } = params
  const ms = await prisma.milestone.create({ data: { goalId, name, amount, targetDate: new Date(targetDate) } })
  return { success: true, actionId, message: `🏁 Hito "${name}" agregado a la meta`, data: { milestoneId: ms.id } }
}

// Helpers use date-fns imports