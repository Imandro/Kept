import { z } from 'zod'

// ============ Tipos Base ============

export interface FinancialContext {
  userId: string
  accounts: Array<{ id: string; name: string; type: string; balance: number }>
  transactions: Array<{
    id: string; amount: number; type: string; description: string;
    date: string; category?: { name: string; icon: string; color: string };
    account: { name: string }; goal?: { name: string } | null
  }>
  goals: Array<{
    id: string; name: string; targetAmount: number; currentAmount: number;
    targetDate: string; status: string; icon?: string; color?: string
  }>
  budgets: Array<{
    id: string; name: string; amount: number; spent: number;
    category: { name: string; icon: string; color: string }
  }>
  summary: {
    income: number; expenses: number; savings: number; balance: number
  }
  patterns?: SpendingPattern[]
}

export interface SpendingPattern {
  type: 'recurring' | 'anomaly' | 'trend' | 'subscription' | 'category_spike'
  description: string
  severity: 'low' | 'medium' | 'high'
  data: any
  suggestion?: string
}

// ============ Spark Types ============

export type SparkType = 
  | 'daily_insight' 
  | 'micro_challenge' 
  | 'pattern_alert' 
  | 'goal_suggestion' 
  | 'celebration' 
  | 'micro_lesson' 
  | 'weekly_review'
  | 'milestone'

export interface Spark {
  id: string
  type: SparkType
  title: string
  message: string
  insight?: string
  action?: SparkAction
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'spending' | 'saving' | 'goals' | 'habits' | 'education'
  metadata?: Record<string, any>
  createdAt: string
  expiresAt?: string
  dismissed?: boolean
  completed?: boolean
}

export interface SparkAction {
  type: 'create_transaction' | 'create_goal' | 'update_budget' | 'transfer' | 'set_reminder' | 'open_screen' | 'none'
  label: string
  payload?: Record<string, any>
  confirmationRequired: boolean
}

// ============ Action Types ============

export type ActionType = 
  | 'create_transaction'
  | 'create_goal'
  | 'update_goal'
  | 'create_budget'
  | 'update_budget'
  | 'transfer_between_accounts'
  | 'create_recurring'
  | 'update_recurring'
  | 'set_savings_allocation'
  | 'create_milestone'

export interface FinanceAction {
  type: ActionType
  params: Record<string, any>
  description: string
  requiresConfirmation: boolean
  estimatedImpact?: {
    savingsChange?: number
    goalProgress?: number
    budgetImpact?: number
  }
}

export interface ActionResult {
  success: boolean
  actionId: string
  message: string
  data?: any
  error?: string
  undoAction?: FinanceAction
}

// ============ Chat Types ============

export interface SparkMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolResult?: any
  timestamp: string
  metadata?: {
    sparksGenerated?: Spark[]
    actionExecuted?: ActionResult
    contextUsed?: string[]
  }
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
}

export interface ChatContext {
  messages: SparkMessage[]
  financialContext: FinancialContext
  activeSparks: Spark[]
  userPreferences: {
    personality: 'coach' | 'analyst' | 'minimalist' | 'friend'
    language: string
    timezone: string
  }
}

// ============ Zod Schemas para Validación ============

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'TRANSFER']),
  description: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: z.string(),
  categoryId: z.string().optional(),
  goalId: z.string().optional(),
  notes: z.string().optional(),
})

export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(50),
  targetAmount: z.number().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const TransferSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
})

export const CreateBudgetSchema = z.object({
  categoryId: z.string(),
  amount: z.number().positive(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})