import { FinanceAction, ActionResult, FinancialContext } from '@/lib/ai/types'
import { executeAction } from './finance-tools'

// ============ Parser de Intención a Acción ============

export interface ParsedAction {
  action: FinanceAction | null
  confidence: number
  clarificationNeeded?: string
  missingParams?: string[]
}

export function parseUserIntent(message: string, context: FinancialContext): ParsedAction {
  const lower = message.toLowerCase()
  
  // 1. Crear Transacción
  if (matchesIntent(lower, ['gasto', 'gasté', 'compré', 'pagué', 'comprar', 'pagar', 'expense', 'spent'])) {
    return parseTransactionIntent(message, context, 'EXPENSE')
  }
  if (matchesIntent(lower, ['ingreso', 'ingresó', 'recibí', 'cobré', 'salario', 'income', 'earned'])) {
    return parseTransactionIntent(message, context, 'INCOME')
  }
  if (matchesIntent(lower, ['ahorro', 'ahorré', 'guardé', 'aparté', 'saving', 'saved'])) {
    return parseTransactionIntent(message, context, 'SAVING')
  }
  if (matchesIntent(lower, ['transfer', 'transferí', 'mover', 'pasar', 'enviar'])) {
    return parseTransferIntent(message, context)
  }

  // 2. Metas
  if (matchesIntent(lower, ['meta', 'objetivo', 'goal', 'crear meta', 'nueva meta', 'quiero ahorrar para'])) {
    return parseGoalIntent(message, context)
  }
  if (matchesIntent(lower, ['aportar a', 'agregar a', 'sumar a', 'contribuir a'])) {
    return parseGoalContribution(message, context)
  }

  // 3. Presupuestos
  if (matchesIntent(lower, ['presupuesto', 'budget', 'limite', 'límite de gasto'])) {
    return parseBudgetIntent(message, context)
  }

  // 4. Cuentas
  if (matchesIntent(lower, ['cuenta', 'account', 'nueva cuenta', 'crear cuenta'])) {
    return { action: null, confidence: 0, clarificationNeeded: 'Para crear cuentas ve a Configuración > Cuentas' }
  }

  // 5. Consultas / Análisis
  if (matchesIntent(lower, ['cómo voy', 'como voy', 'resumen', 'balance', 'cómo estoy', 'estado'])) {
    return { action: null, confidence: 0.9, clarificationNeeded: 'summary_request' }
  }
  if (matchesIntent(lower, ['patrón', 'patron', 'analiza', 'analisis', 'gasto', 'donde gasto'])) {
    return { action: null, confidence: 0.9, clarificationNeeded: 'analysis_request' }
  }

  return { action: null, confidence: 0, clarificationNeeded: 'No entendí. Puedes decirme: "Gasté $200 en comida", "Crear meta viaje $10000", "¿Cómo voy este mes?"' }
}

function matchesIntent(text: string, keywords: string[]): boolean {
  return keywords.some(k => text.includes(k))
}

// ============ Parsers Específicos ============

function parseTransactionIntent(message: string, context: FinancialContext, type: 'EXPENSE' | 'INCOME' | 'SAVING'): ParsedAction {
  // Extraer monto
  const amountMatch = message.match(/\$?(\d+(?:[.,]\d+)?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null

  // Extraer descripción (texto después del monto)
  let description = message
    .replace(/\$?\d+(?:[.,]\d+)?/, '')
    .replace(/^(gasto|gasté|compré|pagué|ingreso|ingresó|recibí|cobré|ahorro|ahorré|guardé|aparté)\s*/i, '')
    .replace(/^(en|para|de|con)\s+/i, '')
    .trim() || `${type === 'EXPENSE' ? 'Gasto' : type === 'INCOME' ? 'Ingreso' : 'Ahorro'} rápido`

  // Buscar categoría por palabras clave
  const categoryId = findCategoryByKeywords(message, context, type)
  const accountId = findAccountByKeywords(message, context) || context.accounts[0]?.id
  const goalId = findGoalByKeywords(message, context)

  if (!amount) {
    return { action: null, confidence: 0.5, clarificationNeeded: '¿Cuánto? Ej: "Gasté $150 en supermercado"' }
  }

  return {
    action: {
      type: 'create_transaction',
      params: { amount, type, description: description.substring(0, 100), date: new Date().toISOString().split('T')[0], accountId, categoryId, goalId },
      description: `Registrar ${type.toLowerCase()}: ${description} - $${amount}`,
      requiresConfirmation: true,
    },
    confidence: 0.85,
  }
}

function parseTransferIntent(message: string, context: FinancialContext): ParsedAction {
  const amountMatch = message.match(/\$?(\d+(?:[.,]\d+)?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null

  const fromAccount = findAccountByKeywords(message.replace(/^(transfer|transferí|mover|pasar|enviar)\s*/i, ''), context, 'from')
  const toAccount = findAccountByKeywords(message, context, 'to')

  if (!amount || !fromAccount || !toAccount) {
    return { action: null, confidence: 0.4, clarificationNeeded: 'Ej: "Transfiere $500 de Efectivo a Banco"' }
  }

  return {
    action: {
      type: 'transfer_between_accounts',
      params: { fromAccountId: fromAccount, toAccountId: toAccount, amount, description: 'Transferencia por comando de voz' },
      description: `Transferir $${amount} de ${context.accounts.find(a => a.id === fromAccount)?.name} a ${context.accounts.find(a => a.id === toAccount)?.name}`,
      requiresConfirmation: true,
    },
    confidence: 0.8,
  }
}

function parseGoalIntent(message: string, context: FinancialContext): ParsedAction {
  // Extraer nombre y monto
  const nameMatch = message.match(/(?:meta|objetivo|goal)\s+(?:para|de\s+)?["']?([^"']+)["']?/i)
  const amountMatch = message.match(/\$?(\d+(?:[.,]\d+)?)/)
  
  const name = nameMatch ? nameMatch[1].trim() : 'Nueva Meta'
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null
  const targetDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] // 3 meses por defecto

  if (!amount) {
    return { action: null, confidence: 0.5, clarificationNeeded: '¿Cuánto quieres ahorrar? Ej: "Meta vacaciones $15000"' }
  }

  return {
    action: {
      type: 'create_goal',
      params: { name, targetAmount: amount, targetDate, description: `Meta creada por Spark: ${name}` },
      description: `Crear meta "${name}" por $${amount.toLocaleString()}`,
      requiresConfirmation: true,
    },
    confidence: 0.85,
  }
}

function parseGoalContribution(message: string, context: FinancialContext): ParsedAction {
  const amountMatch = message.match(/\$?(\d+(?:[.,]\d+)?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null
  const goalId = findGoalByKeywords(message, context)

  if (!amount || !goalId) {
    return { action: null, confidence: 0.4, clarificationNeeded: 'Ej: "Aportar $500 a meta vacaciones"' }
  }

  return {
    action: {
      type: 'create_transaction',
      params: { amount, type: 'SAVING', description: 'Aporte a meta', date: new Date().toISOString().split('T')[0], accountId: context.accounts[0]?.id, goalId },
      description: `Aportar $${amount} a la meta`,
      requiresConfirmation: true,
    },
    confidence: 0.8,
  }
}

function parseBudgetIntent(message: string, context: FinancialContext): ParsedAction {
  const amountMatch = message.match(/\$?(\d+(?:[.,]\d+)?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null
  const categoryId = findCategoryByKeywords(message, context, 'EXPENSE')

  if (!amount || !categoryId) {
    return { action: null, confidence: 0.4, clarificationNeeded: 'Ej: "Presupuesto $2000 para comida"' }
  }

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    action: {
      type: 'create_budget',
      params: { categoryId, amount, periodStart: start.toISOString().split('T')[0], periodEnd: end.toISOString().split('T')[0] },
      description: `Crear presupuesto de $${amount} para la categoría`,
      requiresConfirmation: true,
    },
    confidence: 0.8,
  }
}

// ============ Helpers de Búsqueda ============

function findCategoryByKeywords(message: string, context: FinancialContext, type?: 'INCOME' | 'EXPENSE' | 'SAVING'): string | undefined {
  const categories = context.transactions.flatMap(t => t.category).filter(Boolean)
  const uniqueCats = Array.from(new Map(categories.map(c => [c?.name, c])).values())

  const keywords: Record<string, string[]> = {
    comida: ['comida', 'supermercado', 'mercado', 'despensa', 'restaurante', 'cenar', 'almuerzo', 'comer'],
    transporte: ['transporte', 'gasolina', 'uber', 'taxi', 'bus', 'metro', 'combustible', 'auto', 'coche'],
    vivienda: ['vivienda', 'renta', 'alquiler', 'hipoteca', 'casa', 'departamento'],
    servicios: ['servicios', 'luz', 'electricidad', 'agua', 'internet', 'telefono', 'celular', 'gas'],
    entretenimiento: ['entretenimiento', 'cine', 'netflix', 'spotify', 'juegos', 'diversion', 'fiesta', 'bar'],
    salud: ['salud', 'farmacia', 'medico', 'doctor', 'medicina', 'hospital', 'seguro'],
    compras: ['compras', 'ropa', 'zapatos', 'amazon', 'mercadolibre', 'tienda', 'shopping'],
    suscripciones: ['suscripciones', 'suscripcion', 'netflix', 'spotify', 'prime', 'suscripciones'],
  }

  const lower = message.toLowerCase()
  for (const [catName, words] of Object.entries(keywords)) {
    if (words.some((k: string) => lower.includes(k))) {
      const cat = uniqueCats.find(c => c?.name?.toLowerCase().includes(catName))
      if (cat) return (cat as any).id
    }
  }
  return undefined
}

function findAccountByKeywords(message: string, context: FinancialContext, direction?: 'from' | 'to'): string | undefined {
  const keywords: Record<string, string[]> = {
    efectivo: ['efectivo', 'cash', 'bolso', 'billetera', 'mano'],
    banco: ['banco', 'cuenta', 'debito', 'débito', 'tarjeta', 'bbva', 'banorte', 'santander', 'hsbc'],
    ahorro: ['ahorro', 'ahorros', 'inversion', 'inversión', 'investment'],
  }

  const lower = message.toLowerCase()
  for (const [accType, words] of Object.entries(keywords)) {
    if (words.some((k: string) => lower.includes(k))) {
      const acc = context.accounts.find(a => a.type === accType || a.name.toLowerCase().includes(accType))
      if (acc) return acc.id
    }
  }
  return context.accounts[0]?.id
}

function findGoalByKeywords(message: string, context: FinancialContext): string | undefined {
  const lower = message.toLowerCase()
  for (const goal of context.goals) {
    if (lower.includes(goal.name.toLowerCase())) return goal.id
  }
  // Buscar por palabras clave comunes
  const goalKeywords: Record<string, string[]> = {
    emergencia: ['emergencia', 'emergencias', 'fondo', 'colchon', 'colchón'],
    vacaciones: ['vacaciones', 'viaje', 'playa', 'turismo'],
    auto: ['auto', 'coche', 'carro', 'vehiculo', 'vehículo'],
    casa: ['casa', 'departamento', 'inmueble', 'propiedad'],
  }
  for (const [key, keywords] of Object.entries(goalKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      const goal = context.goals.find(g => g.name.toLowerCase().includes(key))
      if (goal) return goal.id
    }
  }
  return undefined
}

// ============ Generador de Respuestas Naturales ============

export function generateActionResponse(result: ActionResult, action: any): string {
  if (!result.success) {
    return `❌ No pude completar la acción: ${result.error || result.message}`
  }

  const responses = {
    create_transaction: [
      `✅ Listo. Registré: ${action.params.description} (${action.params.type === 'EXPENSE' ? '−' : '+'}$${action.params.amount})`,
      `¡Hecho! ${action.params.type === 'EXPENSE' ? 'Gasto' : 'Ingreso/Ahorro'} de $${action.params.amount} en "${action.params.description}" guardado.`,
    ],
    create_goal: [
      `🎯 Meta creada: "${action.params.name}" por $${action.params.targetAmount.toLocaleString()}. ¡Vamos por ella!`,
      `¡Meta lista! "${action.params.name}" con objetivo de $${action.params.targetAmount.toLocaleString()}. Te ayudaré a alcanzarla.`,
    ],
    create_budget: [
      `📊 Presupuesto establecido: $${action.params.amount.toLocaleString()} para esta categoría. Te avisaré si te acercas al límite.`,
    ],
    transfer_between_accounts: [
      `🔄 Transferencia de $${action.params.amount.toLocaleString()} completada entre cuentas.`,
    ],
    create_recurring: [
      `🔁 Transacción recurrente configurada. Se ejecutará automáticamente.`,
    ],
  }

  const options = responses[action.type as keyof typeof responses] || [`✅ Acción completada: ${result.message}`]
  return options[Math.floor(Math.random() * options.length)]
}