import { FinancialContext, Spark, SpendingPattern, SparkAction, SparkType } from '@/lib/ai/types'

// ============ Generador de Sparks Diarios ============

export function generateDailySpark(context: FinancialContext): Spark[] {
  const sparks: Spark[] = []
  const { summary, goals, budgets, patterns, transactions } = context
  const today = new Date().toISOString().split('T')[0]

  // 1. Spark de Insight Diario (basado en patrones)
  if (patterns?.length) {
    const topPattern = patterns[0]!
    sparks.push(createPatternSpark(topPattern, today))
  }

  // 2. Spark de Meta en Riesgo
  const atRiskGoals = goals.filter(g => {
    const progress = (g.currentAmount / g.targetAmount) * 100
    const daysLeft = Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000)
    const requiredRate = (g.targetAmount - g.currentAmount) / Math.max(daysLeft, 1)
    const recentSaving = transactions
      .filter(t => t.type === 'SAVING' && t.goal?.name === g.name)
      .reduce((s, t) => s + t.amount, 0)
    return progress < 50 && daysLeft < 60 && recentSaving < requiredRate * 7
  })

  if (atRiskGoals.length > 0) {
    sparks.push(createGoalAtRiskSpark(atRiskGoals[0], today))
  }

  // 3. Spark de Presupuesto en Alerta
  const alertBudgets = budgets.filter(b => (b.spent / b.amount) > 0.85)
  if (alertBudgets.length > 0) {
    sparks.push(createBudgetAlertSpark(alertBudgets[0], today))
  }

  // 3. Spark de Tasa de Ahorro
  const savingsRate = summary.income > 0 ? (summary.savings / summary.income) * 100 : 0
  if (savingsRate < 10 && summary.income > 0) {
    sparks.push(createLowSavingsRateSpark(savingsRate, today))
  } else if (savingsRate >= 20) {
    sparks.push(createHighSavingsRateSpark(savingsRate, today))
  }

  // 5. Spark de Racha / Hábito
  const streak = calculateStreak(transactions)
  if (streak >= 3) {
    sparks.push(createStreakSpark(streak, today))
  }

  // 6. Spark Educativo Aleatorio
  if (Math.random() < 0.3) {
    sparks.push(createMicroLessonSpark(today))
  }

  return sparks
}

function createPatternSpark(pattern: SpendingPattern, date: string): Spark {
  const actions: Record<string, SparkAction> = {
    subscription: { type: 'open_screen', label: 'Ver suscripciones', payload: { screen: 'subscriptions' }, confirmationRequired: false },
    category_spike: { type: 'open_screen', label: 'Ver detalles', payload: { screen: 'transactions', filter: { category: pattern.data.category } }, confirmationRequired: false },
    recurring: { type: 'open_screen', label: 'Ver gastos', payload: { screen: 'transactions' }, confirmationRequired: false },
    trend: { type: 'create_transaction', label: 'Ahorrar ahora', payload: { type: 'SAVING', description: 'Ahorro automático' }, confirmationRequired: true },
  }

  return {
    id: `spark_${Date.now()}_pattern`,
    type: 'pattern_alert',
    title: '🔍 Patrón Detectado',
    message: pattern.description,
    insight: pattern.suggestion,
    action: actions[pattern.type] || { type: 'none', label: 'Entendido', confirmationRequired: false },
    priority: pattern.severity === 'high' ? 'high' : 'medium',
    category: 'spending',
    metadata: { patternType: pattern.type, patternData: pattern.data },
    createdAt: date,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

function createGoalAtRiskSpark(goal: any, date: string): Spark {
  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
  const needed = goal.targetAmount - goal.currentAmount
  const dailyNeeded = needed / Math.max(daysLeft, 1)

  return {
    id: `spark_${Date.now()}_goal_risk`,
    type: 'goal_suggestion',
    title: '⚠️ Meta en Riesgo',
    message: `"${goal.name}" va al ${progress.toFixed(0)}%. Faltan $${needed.toLocaleString()} en ${daysLeft} días ($${dailyNeeded.toFixed(0)}/día)`,
    insight: 'Automatiza un aporte diario o semanal para alcanzarla a tiempo',
    action: {
      type: 'create_transaction',
      label: 'Aportar ahora',
      payload: { type: 'SAVING', description: `Aporte a ${goal.name}`, goalId: goal.id, amount: dailyNeeded },
      confirmationRequired: true,
    },
    priority: 'high',
    category: 'goals',
    metadata: { goalId: goal.id, progress, daysLeft, dailyNeeded },
    createdAt: date,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  }
}

function createBudgetAlertSpark(budget: any, date: string): Spark {
  const percent = (budget.spent / budget.amount) * 100
  const remaining = budget.amount - budget.spent

  return {
    id: `spark_${Date.now()}_budget`,
    type: 'pattern_alert',
    title: percent >= 100 ? '🚨 Presupuesto Excedido' : '⚠️ Presupuesto en Alerta',
    message: `${budget.category.name}: $${budget.spent.toLocaleString()} de $${budget.amount.toLocaleString()} (${percent.toFixed(0)}%)`,
    insight: percent >= 100 ? 'Ya superaste el límite. Considera ajustar o mover fondos.' : `Te quedan $${remaining.toLocaleString()}. Frena gastos en esta categoría.`,
    action: { type: 'open_screen', label: 'Ver presupuesto', payload: { screen: 'budgets', budgetId: budget.id }, confirmationRequired: false },
    priority: percent >= 100 ? 'urgent' : 'high',
    category: 'spending',
    metadata: { budgetId: budget.id, percent, remaining },
    createdAt: date,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  }
}

function createLowSavingsRateSpark(rate: number, date: string): Spark {
  return {
    id: `spark_${Date.now()}_low_save`,
    type: 'micro_challenge',
    title: '💡 Reto de Ahorro',
    message: `Tu tasa de ahorro es ${rate.toFixed(1)}%. El objetivo recomendado es 20%+`,
    insight: 'Prueba el método 50/30/20: 50% necesidades, 30% deseos, 20% ahorro/inversión',
    action: {
      type: 'create_transaction',
      label: 'Iniciar ahorro automático',
      payload: { type: 'SAVING', description: 'Ahorro método 50/30/20', amount: 100 },
      confirmationRequired: true,
    },
    priority: 'medium',
    category: 'saving',
    metadata: { currentRate: rate, targetRate: 20 },
    createdAt: date,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

function createHighSavingsRateSpark(rate: number, date: string): Spark {
  return {
    id: `spark_${Date.now()}_high_save`,
    type: 'celebration',
    title: '🏆 ¡Excelente Ahorro!',
    message: `Estás ahorrando ${rate.toFixed(1)}% de tus ingresos. ¡Superas la meta del 20%!`,
    insight: 'Considera invertir el excedente para hacerlo crecer',
    action: { type: 'open_screen', label: 'Ver inversiones', payload: { screen: 'investments' }, confirmationRequired: false },
    priority: 'low',
    category: 'saving',
    metadata: { rate },
    createdAt: date,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

function createStreakSpark(streak: number, date: string): Spark {
  return {
    id: `spark_${Date.now()}_streak`,
    type: 'celebration',
    title: '🔥 Racha Activa',
    message: `${streak} días seguidos registrando tus finanzas. ¡Consistencia = Progreso!`,
    insight: 'Los hábitos pequeños crean grandes resultados. Mantén la racha.',
    action: { type: 'none', label: 'Continuar', confirmationRequired: false },
    priority: 'low',
    category: 'habits',
    metadata: { streak },
    createdAt: date,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

function createMicroLessonSpark(date: string): Spark {
  const lessons = [
    { title: '💡 Regla del 24h', message: 'Antes de compras >$500, espera 24h. El 80% de compras impulsivas se arrepienten.', category: 'spending' },
    { title: '💡 Págate Primero', message: 'Al recibir ingresos, mueve ahorro ANTES de gastar. No ahorres lo que sobra.', category: 'saving' },
    { title: '💡 Interés Compuesto', message: '$100/mes al 8% = $183k en 30 años. El tiempo es tu mejor aliado.', category: 'education' },
    { title: '💡 Fondo Emergencia', message: '3-6 meses de gastos en cuenta accesible. Es tu seguro financiero personal.', category: 'saving' },
    { title: '💡 Regla 50/30/20', message: '50% necesidades, 30% deseos, 20% ahorro/deuda. Simple y efectivo.', category: 'education' },
    { title: '💡 Gastos Hormiga', message: 'Gastos ≤$50 suman miles al mes. Úsalos en efectivo para controlarlos.', category: 'spending' },
  ]
  const lesson = lessons[Math.floor(Math.random() * lessons.length)]

  return {
    id: `spark_${Date.now()}_lesson`,
    type: 'micro_lesson',
    title: lesson.title,
    message: lesson.message,
    insight: 'Aplica esto hoy y verás la diferencia en 30 días',
    action: { type: 'none', label: 'Entendido', confirmationRequired: false },
    priority: 'low',
    category: lesson.category as any,
    metadata: {},
    createdAt: date,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }
}

function calculateStreak(transactions: any[]): number {
  const dates = new Set(transactions.map(t => t.date.split('T')[0]))
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = today

  while (dates.has(checkDate)) {
    streak++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = d.toISOString().split('T')[0]
  }
  return streak
}

// ============ Spark Semanal ============

export function generateWeeklyReview(context: FinancialContext): Spark {
  const { summary, goals, transactions, patterns } = context
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const weekTx = transactions.filter(t => new Date(t.date) >= weekAgo)

  const topCategory = getTopCategory(weekTx)
  const bestDay = getBestDay(weekTx)
  const goalProgress = goals.filter(g => g.status === 'ACTIVE').map(g => ({
    name: g.name,
    progress: Math.round((g.currentAmount / g.targetAmount) * 100),
  }))

  return {
    id: `spark_weekly_${Date.now()}`,
    type: 'weekly_review',
    title: '📊 Tu Semana Financiera',
    message: `Ingresos: $${summary.income.toLocaleString()} | Gastos: $${summary.expenses.toLocaleString()} | Ahorro: $${summary.savings.toLocaleString()}`,
    insight: `Tu mayor gasto: ${topCategory}. Día más ahorrador: ${bestDay}. ${goalProgress.map(g => `${g.name}: ${g.progress}%`).join(', ')}`,
    action: { type: 'open_screen', label: 'Ver reporte completo', payload: { screen: 'analytics' }, confirmationRequired: false },
    priority: 'medium',
    category: 'habits',
    metadata: { topCategory, bestDay, goalProgress, weekTx: weekTx.length },
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function getTopCategory(transactions: any[]): string {
  const expenses = transactions.filter(t => t.type === 'EXPENSE')
  const byCat = expenses.reduce((acc, t) => {
    const cat = t.category?.name || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)
  const top = Object.entries(byCat as Record<string, number>).sort((a, b) => b[1] - a[1])[0]
  return top ? `${top[0]} ($${top[1].toLocaleString()})` : 'Ninguno'
}

function getBestDay(transactions: any[]): string {
  const savings = transactions.filter(t => t.type === 'SAVING')
  const byDay = savings.reduce((acc, t) => {
    const day = new Date(t.date).getDay()
    acc[day] = (acc[day] || 0) + t.amount
    return acc
  }, {} as Record<number, number>)
  const best = Object.entries(byDay as Record<string, number>).sort((a, b) => b[1] - a[1])[0]
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return best ? `${days[parseInt(best[0])]} ($${best[1].toLocaleString()})` : 'Ninguno'
}