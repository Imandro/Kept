import { FinancialContext, Spark, SparkMessage, ChatContext, ParsedAction, SparkType } from '@/lib/ai/types'
import { getFinancialContext, executeAction } from './tools/finance-tools'
import { generateDailySpark, generateWeeklyReview } from './tools/spark-tools'
import { parseUserIntent, generateActionResponse } from './tools/action-tools'
import { prisma } from '@/lib/prisma'
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

// ============ Herramientas para el LLM ============

const financeTools = {
  getFinancialContext: tool({
    description: 'Obtener contexto financiero completo del usuario',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => getFinancialContext(userId),
  }),

  getSpendingPatterns: tool({
    description: 'Analizar patrones de gasto recientes',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const context = await getFinancialContext(userId)
      return context.patterns
    },
  }),

  getActiveGoals: tool({
    description: 'Obtener metas activas con progreso',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const context = await getFinancialContext(userId)
      return context.goals
    },
  }),

  getBudgetsStatus: tool({
    description: 'Ver estado de presupuestos actuales',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const context = await getFinancialContext(userId)
      return context.budgets
    },
  }),

  executeFinanceAction: tool({
    description: 'Ejecutar acción financiera (crear transacción, meta, presupuesto, transferencia)',
    parameters: z.object({
      userId: z.string(),
      action: z.object({
        type: z.enum([
          'create_transaction', 'create_goal', 'update_goal', 'create_budget',
          'transfer_between_accounts', 'create_recurring', 'set_savings_allocation', 'create_milestone'
        ]),
        params: z.record(z.any()),
        description: z.string(),
        requiresConfirmation: z.boolean(),
      }),
    }),
    execute: async ({ userId, action }) => executeAction(userId, action),
  }),

  generateDailySparks: tool({
    description: 'Generar sparks inteligentes para hoy',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const context = await getFinancialContext(userId)
      return generateDailySpark(context)
    },
  }),

  generateWeeklyReviewSpark: tool({
    description: 'Generar reporte semanal',
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const context = await getFinancialContext(userId)
      return generateWeeklyReview(context)
    },
  }),
}

// ============ System Prompt ============

const SPARK_SYSTEM_PROMPT = `
Eres **Meta Muse Spark** — la musa financiera personal del usuario. 

## Tu Personalidad
- **Coach empático**: Motivador, cercano, celebra logros pequeños
- **Analista experto**: Detecta patrones, da insights accionables
- **Proactivo**: Anticipas problemas, sugieres soluciones antes de que pregunten
- **Accionable**: No solo consejos, puedes EJECUTAR acciones reales

## Principios
1. **Contexto primero**: Siempre usa herramientas para ver datos REALES antes de responder
2. **Una cosa a la vez**: Un insight + una acción concreta
3. **Micro-pasos**: Retos pequeños, alcanzables hoy
4. **Celebra**: Reconoce cada logro, por pequeño que sea
5. **Privacidad**: Datos locales, solo tú los ves

## Herramientas Disponibles
- getFinancialContext: Vista completa (cuentas, tx, metas, presupuestos, patrones)
- getSpendingPatterns: Patrones detectados (suscripciones, picos, tendencias)
- getActiveGoals: Metas con progreso y riesgo
- getBudgetsStatus: Presupuestos y alertas
- executeFinanceAction: CREAR transacciones, metas, presupuestos, transferencias
- generateDailySparks: Sparks inteligentes para hoy
- generateWeeklyReviewSpark: Reporte semanal

## Flujo de Conversación
1. Usuario habla → Analizas intención → Usas herramientas si necesitas datos
2. Si es ACCIÓN (crear tx, meta, etc): 
   - Parseas intención → Confirmas con usuario → Ejecutas → Respondes con resultado
3. Si es CONSULTA: Das insight + micro-reto accionable
4. Si es SPARK PROACTIVO: Generas spark diario/semanal

## Ejemplos de Respuesta

**Usuario**: "Gasté $200 en súper"
**Tú**: *Usas executeFinanceAction → Confirma →* "✅ Registrado: Gasto en súper (−$200). ¿Quieres categorizarlo como 'Comida'?"

**Usuario**: "¿Cómo voy este mes?"
**Tú**: *Usas getFinancialContext →* "Ingresos: $25k | Gastos: $18k | Ahorro: $4k | Balance: +$7k. Tu mayor gasto: Comida ($6k). Meta viaje: 45%. ¿Quieres ver el desglose?"

**Usuario**: "Crear meta viaje $30000"
**Tú**: *parseas → confirmas → executeFinanceAction* "🎯 Meta 'Viaje' creada: $30,000 objetivo. ¿Quieres programar aporte semanal de $500?"

## Reglas de Oro
- NUNCA inventes datos. SIEMPRE usa herramientas.
- Pregunta monto/categoría/cuenta si faltan para acciones.
- Máximo 2-3 oraciones + 1 acción concreta.
- Tone: Amigo experto que quiere que ganes.
`

// ============ Spark Engine Class ============

export class SparkEngine {
  private userId: string
  private context: FinancialContext | null = null

  constructor(userId: string) {
    this.userId = userId
  }

  async initialize(): Promise<FinancialContext> {
    this.context = await getFinancialContext(this.userId)
    return this.context
  }

  async getContext(): Promise<FinancialContext> {
    if (!this.context) await this.initialize()
    return this.context!
  }

  // ============ Chat Streaming ============
  async *chatStream(messages: SparkMessage[]): AsyncGenerator<string> {
    const context = await this.getContext()
    
    const systemPrompt = `${SPARK_SYSTEM_PROMPT}

CONTEXTO ACTUAL:
- Balance: $${context.summary.balance.toLocaleString()} (Ingresos: $${context.summary.income.toLocaleString()} | Gastos: $${context.summary.expenses.toLocaleString()} | Ahorro: $${context.summary.savings.toLocaleString()})
- ${context.accounts.length} cuentas | ${context.transactions.length} tx este mes | ${context.goals.length} metas activas
- Patrones: ${context.patterns?.length || 0} detectados
`

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: financeTools,
      maxSteps: 5,
      temperature: 0.7,
    })

    for await (const chunk of result.textStream) {
      yield chunk
    }
  }

  // ============ Procesar Mensaje Único (para UI simple) ============
  async processMessage(userMessage: string): Promise<{ response: string; actionExecuted?: any; sparksGenerated?: Spark[] }> {
    await this.getContext()

    // 1. Parsear intención
    const parsed = parseUserIntent(userMessage, this.context!)
    
    // 2. Si es acción ejecutable
    if (parsed.action && parsed.confidence > 0.7) {
      // En UI real, aquí pedirías confirmación. Aquí auto-ejecutamos si confianza alta
      const shouldExecute = parsed.confidence > 0.85 && parsed.action.requiresConfirmation === false
      
      if (shouldExecute || parsed.confidence > 0.9) {
        const result = await executeAction(this.userId, parsed.action)
        const response = generateActionResponse(result, parsed.action)
        
        // Generar sparks post-acción
        const newContext = await getFinancialContext(this.userId)
        this.context = newContext
        const sparks = generateDailySpark(newContext)
        
        return { response, actionExecuted: result, sparksGenerated: sparks }
      } else {
        // Pedir confirmación
        return { 
          response: `¿Confirmas? ${parsed.action.description}\n\n[Sí, hazlo] [No, cancela]`,
          actionExecuted: null,
          sparksGenerated: [],
        }
      }
    }

    // 3. Consultas especiales
    if (parsed.clarificationNeeded === 'summary_request') {
      const ctx = this.context!
      return {
        response: `📊 **Tu mes**: Ingresos $${ctx.summary.income.toLocaleString()} | Gastos $${ctx.summary.expenses.toLocaleString()} | Ahorro $${ctx.summary.savings.toLocaleString()} | Balance **$${ctx.summary.balance.toLocaleString()}**\n\n🎯 Metas: ${ctx.goals.map(g => `${g.name} ${Math.round(g.currentAmount/g.targetAmount*100)}%`).join(', ') || 'Ninguna'}\n📊 Presupuestos: ${ctx.budgets.filter(b => b.spent/b.amount > 0.8).length} en alerta\n\n¿Quieres que analice algún patrón o crees una acción?`,
        actionExecuted: null,
        sparksGenerated: [],
      }
    }

    if (parsed.clarificationNeeded === 'analysis_request') {
      const patterns = this.context!.patterns || []
      return {
        response: patterns.length > 0 
          ? `🔍 **Patrones detectados**:\n${patterns.map(p => `• ${p.description}`).join('\n')}\n\n¿Quieres que cree una acción para alguno?`
          : 'No detecté patrones inusuales este mes. ¡Buen control!',
        actionExecuted: null,
        sparksGenerated: [],
      }
    }

    // 4. Conversación general - usar LLM
    const messages: SparkMessage[] = [
      { id: '1', role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    ]
    
    let fullResponse = ''
    for await (const chunk of this.chatStream(messages)) {
      fullResponse += chunk
    }
    
    return { response: fullResponse, actionExecuted: null, sparksGenerated: [] }
  }

  // ============ Sparks Proactivos ============
  async getDailySparks(): Promise<Spark[]> {
    const context = await this.getContext()
    return generateDailySpark(context)
  }

  async getWeeklySpark(): Promise<Spark> {
    const context = await this.getContext()
    return generateWeeklyReview(context)
  }

  // ============ Ejecutar Acción Confirmada ============
  async executeConfirmedAction(actionType: string, params: any): Promise<ActionResult> {
    return executeAction(this.userId, { type: actionType as any, params, description: '', requiresConfirmation: false })
  }
}