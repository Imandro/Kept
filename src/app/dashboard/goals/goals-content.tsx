'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, Target, TrendingUp, Clock, CheckCircle, AlertCircle, Edit, Trash2, Flag } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GoalForm } from '@/components/forms/goal-form'

interface Goal {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  currency: string
  startDate: string
  targetDate: string
  status: string
  icon: string | null
  color: string | null
  milestones: Array<{
    id: string
    name: string
    amount: number
    targetDate: string
    isCompleted: boolean
    completedAt: string | null
  }>
}

export default function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalSubmit = async (data: any) => {
    const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals'
    const method = editingGoal ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (res.ok) {
      fetchGoals()
      setEditingGoal(null)
      setFormOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta meta?')) return
    
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    if (res.ok) fetchGoals()
  }

  const getProgress = (goal: Goal) => (goal.currentAmount / goal.targetAmount) * 100
  const getDaysLeft = (targetDate: string) => 
    Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="h-48 bg-gray-200 dark:bg-gray-700 rounded" /></Card>
          ))}
        </div>
      </div>
    )
  }

  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  const completedGoals = goals.filter(g => g.status === 'COMPLETED')

  return (
    <>
      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleGoalSubmit}
        defaultValues={editingGoal ? {
          name: editingGoal.name,
          description: editingGoal.description || undefined,
          targetAmount: editingGoal.targetAmount,
          startDate: editingGoal.startDate.split('T')[0],
          targetDate: editingGoal.targetDate.split('T')[0],
          icon: editingGoal.icon || undefined,
          color: editingGoal.color || undefined,
        } : undefined}
        isEditing={!!editingGoal}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metas de Ahorro</h1>
            <p className="text-gray-500">Define y alcanza tus objetivos financieros</p>
          </div>
          <Button onClick={() => { setEditingGoal(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Meta
          </Button>
        </div>

        {/* Resumen rápido */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Metas Activas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
                </div>
                <Target className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completadas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedGoals.length}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Objetivo</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(activeGoals.reduce((sum, g) => sum + g.targetAmount, 0))}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metas Activas */}
        {activeGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">En Progreso</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map(goal => {
                const progress = getProgress(goal)
                const daysLeft = getDaysLeft(goal.targetDate)
                const isOverdue = daysLeft < 0
                const nextMilestone = goal.milestones.find(m => !m.isCompleted)
                
                return (
                  <Card key={goal.id} className="overflow-hidden">
                    <div className={cn('h-2', goal.color ? `bg-[${goal.color}]` : 'bg-primary')} />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', 
                            goal.color ? `bg-[${goal.color}]20 text-[${goal.color}]` : 'bg-blue-100 text-blue-600'
                          )}>
                            {goal.icon ? <span className="text-xl">{goal.icon}</span> : <Target className="h-6 w-6" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                            <p className="text-sm text-gray-500">{goal.description || 'Sin descripción'}</p>
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
                          <span className={cn('font-bold', progress >= 100 ? 'text-green-600' : goal.color ? `text-[${goal.color}]` : 'text-blue-600')}>
                            {Math.min(Math.round(progress), 100)}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', 
                              progress >= 100 ? 'bg-green-500' : goal.color ? `bg-[${goal.color}]` : 'bg-blue-600'
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Info adicional */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {isOverdue ? `${Math.abs(daysLeft)} días vencida` : `${daysLeft} días restantes`}
                        </span>
                        {nextMilestone && (
                          <span className="flex items-center gap-1">
                            <Flag className="h-3.5 w-3.5" />
                            Próximo: {nextMilestone.name}
                          </span>
                        )}
                      </div>

                      {/* Hitos */}
                      {goal.milestones.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          {goal.milestones.map(ms => (
                            <div key={ms.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full', ms.isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600')} />
                                <span className={cn(ms.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white')}>
                                  {ms.name}
                                </span>
                              </div>
                              <span className={cn('font-medium', ms.isCompleted ? 'text-green-600' : '')}>
                                {formatCurrency(ms.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingGoal(goal); setFormOpen(true) }}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(goal.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Metas Completadas */}
        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completadas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map(goal => (
                <Card key={goal.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                        <p className="text-sm text-gray-500">
                          Completada el {formatDate(goal.targetDate, 'long')} • {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {!activeGoals.length && !completedGoals.length && (
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay metas aún</h3>
              <p className="text-gray-500 mb-6">Crea tu primera meta de ahorro para empezar a alcanzar tus objetivos</p>
              <Button onClick={() => setFormOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Crear Meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}