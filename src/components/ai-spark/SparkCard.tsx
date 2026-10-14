'use client'

import { Spark, SparkType } from '@/lib/ai/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { 
  Zap, AlertCircle, Target, Trophy, BookOpen, Flame, 
  ChevronRight, CheckCircle, X, Clock, Sparkles 
} from 'lucide-react'

const typeConfig: Record<SparkType, { icon: any; color: string; bg: string }> = {
  daily_insight: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  micro_challenge: { icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  pattern_alert: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  goal_suggestion: { icon: Target, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  celebration: { icon: Trophy, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  micro_lesson: { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  weekly_review: { icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  milestone: { icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
}

interface SparkCardProps {
  spark: Spark
  onDismiss: (id: string) => void
  onComplete: (id: string) => void
  onAction: (spark: Spark) => void
  compact?: boolean
}

export function SparkCard({ spark, onDismiss, onComplete, onAction, compact = false }: SparkCardProps) {
  const config = typeConfig[spark.type]
  const Icon = config.icon
  const isUrgent = spark.priority === 'urgent' || spark.priority === 'high'
  const expired = spark.expiresAt && new Date(spark.expiresAt) < new Date()

  if (expired) return null

  const timeLeft = spark.expiresAt 
    ? Math.max(0, Math.ceil((new Date(spark.expiresAt).getTime() - Date.now()) / 3600000))
    : null

  return (
    <Card className={cn('overflow-hidden border-l-4', config.color.replace('text', 'border'), compact && 'mb-3', isUrgent && 'ring-2 ring-offset-2', config.color.replace('text', 'ring'))}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg, config.color)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{spark.title}</h3>
              <div className="flex items-center gap-1">
                {timeLeft && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{timeLeft}h</span>}
                <Badge variant={spark.priority === 'urgent' ? 'destructive' : spark.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                  {spark.priority}
                </Badge>
              </div>
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{spark.message}</p>
            
            {spark.insight && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                💡 {spark.insight}
              </p>
            )}

            {spark.metadata && Object.keys(spark.metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Detalles: {JSON.stringify(spark.metadata, null, 0).slice(0, 100)}...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {spark.action && spark.action.type !== 'none' && (
              <Button 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => onAction(spark)}
              >
                <ChevronRight className="h-4 w-4" />
                {spark.action.label}
              </Button>
            )}
            
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onComplete(spark.id)} title="Completado">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDismiss(spark.id)} title="Descartar">
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SparkCarousel({ sparks, onDismiss, onComplete, onAction }: { 
  sparks: Spark[]
  onDismiss: (id: string) => void
  onComplete: (id: string) => void
  onAction: (spark: Spark) => void
}) {
  const activeSparks = sparks.filter(s => !s.dismissed && !s.completed)
  
  if (activeSparks.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Sparks del Día
        </h2>
        <Badge variant="secondary" className="text-xs">{activeSparks.length}</Badge>
      </div>
      <div className="space-y-2">
        {activeSparks.slice(0, 3).map(spark => (
          <SparkCard key={spark.id} spark={spark} onDismiss={onDismiss} onComplete={onComplete} onAction={onAction} compact />
        ))}
        {activeSparks.length > 3 && (
          <Button variant="outline" size="sm" className="w-full text-xs">
            Ver {activeSparks.length - 3} sparks más
          </Button>
        )}
      </div>
    </div>
  )
}