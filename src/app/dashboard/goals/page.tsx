'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/mobile-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, Target, TrendingUp, Clock, CheckCircle, AlertCircle, Edit, Trash2, Flag, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GoalForm } from '@/components/forms/goal-form'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface Goal {
  id: string; name: string; description: string | null; targetAmount: number; currentAmount: number;
  currency: string; startDate: string; targetDate: string; status: string; icon: string | null; color: string | null;
  milestones: Array<{ id: string; name: string; amount: number; targetDate: string; isCompleted: boolean; completedAt: string | null }>
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try { const res = await fetch('/api/goals'); if (res.ok) { const data = await res.json(); setGoals(data) } }
    catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleSubmit = async (data: any) => {
    const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals'
    const method = editingGoal ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { fetchGoals(); setEditingGoal(null); setFormOpen(false) }
  }

  const handleDelete = async (id: string) => { if (!confirm('¿Eliminar?')) return; const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' }); if (res.ok) fetchGoals() }

  const getProgress = (g: Goal) => (g.currentAmount / g.targetAmount) * 100
  const getDaysLeft = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

  if (loading) {
    return <MobileLayout><div className="p-4 space-y-4">{[1,2,3].map(i=><Card key={i}><CardContent className="h-48 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" /></Card>)}</div></MobileLayout>
  }

  const active = goals.filter(g => g.status === 'ACTIVE')
  const completed = goals.filter(g => g.status === 'COMPLETED')

  return (
    <MobileLayout>
      <GoalForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit}
        defaultValues={editingGoal ? { name: editingGoal.name, description: editingGoal.description, targetAmount: editingGoal.targetAmount, startDate: editingGoal.startDate.split('T')[0], targetDate: editingGoal.targetDate.split('T')[0], icon: editingGoal.icon, color: editingGoal.color } : undefined}
        isEditing={!!editingGoal} />

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="h-[90%] max-h-[90%]">
          <SheetHeader><SheetTitle>{selectedGoal?.name}</SheetTitle></SheetHeader>
          <div className="p-4 space-y-6">
            {selectedGoal && (
              <>
                <div className="text-center">
                  <div className={cn('h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4', `bg-[${selectedGoal.color}]20 text-[${selectedGoal.color}]`)}>
                    {selectedGoal.icon && <span className="text-4xl">{selectedGoal.icon}</span>}
                  </div>
                  <h2 className="text-xl font-bold">{selectedGoal.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedGoal.description || 'Sin descripción'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Progreso</span><span className="font-bold">{Math.min(Math.round(getProgress(selectedGoal)),100)}%</span></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', `bg-[${selectedGoal.color}]`)} style={{width:`${Math.min(getProgress(selectedGoal),100)}%`}} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}</span>
                    <span>{getDaysLeft(selectedGoal.targetDate)} días</span>
                  </div>
                </div>

                {selectedGoal.milestones.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h3 className="font-medium">Hitos</h3>
                    {selectedGoal.milestones.map(m => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', m.isCompleted ? 'bg-green-500' : 'bg-gray-300')} />
                          <span className={cn(m.isCompleted ? 'line-through text-gray-500' : '')}>{m.name}</span>
                        </div>
                        <span className={cn('font-medium', m.isCompleted && 'text-green-600')}>{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={()=>{setEditingGoal(selectedGoal!);setFormOpen(true);setDetailSheetOpen(false)}}><Edit className="h-4 w-4 mr-1"/>Editar</Button>
                  <Button variant="outline" className="text-red-600" onClick={()=>handleDelete(selectedGoal!.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Metas</h1>
          <Button onClick={()=>{setEditingGoal(null);setFormOpen(true)}} className="h-10 px-4"><Plus className="h-5 w-5"/></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-900/20"><CardContent className="p-4 text-center"><p className="text-xs text-blue-700">Activas</p><p className="text-2xl font-bold">{active.length}</p></CardContent></Card>
          <Card className="bg-green-50 dark:bg-green-900/20"><CardContent className="p-4 text-center"><p className="text-xs text-green-700">Completadas</p><p className="text-2xl font-bold">{completed.length}</p></CardContent></Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20"><CardContent className="p-4 text-center"><p className="text-xs text-purple-700">Total</p><p className="text-2xl font-bold">{formatCurrency(active.reduce((s,g)=>s+g.targetAmount,0))}</p></CardContent></Card>
        </div>

        {active.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold">En Progreso</h2>
            <div className="space-y-3">
              {active.map(goal => {
                const progress = getProgress(goal)
                const days = getDaysLeft(goal.targetDate)
                const overdue = days < 0
                return (
                  <Sheet open={detailSheetOpen && selectedGoal?.id === goal.id} onOpenChange={open=>{if(!open){setSelectedGoal(null);setDetailSheetOpen(false)}}}>
                    <SheetTrigger asChild>
                      <Card className="overflow-hidden" onClick={()=>{setSelectedGoal(goal);setDetailSheetOpen(true)}}>
                        <div className={cn('h-2', `bg-[${goal.color}]`)} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', `bg-[${goal.color}]20 text-[${goal.color}]`)}>{goal.icon && <span className="text-2xl">{goal.icon}</span>}</div>
                              <div className="min-w-0"><p className="font-medium truncate">{goal.name}</p><p className="text-xs text-gray-500">{overdue ? 'Vencida' : `${days} días`}</p></div>
                            </div>
                            <Badge variant={overdue?'destructive':progress>=100?'success':'default'} className="text-xs">{Math.min(Math.round(progress),100)}%</Badge>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className={cn('h-full rounded-full',`bg-[${goal.color}]`)} style={{width:`${Math.min(progress,100)}%`}}/></div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{formatCurrency(goal.currentAmount)}/{formatCurrency(goal.targetAmount)}</span><span>{Math.round(progress)}%</span></div>
                        </CardContent>
                      </Card>
                    </SheetTrigger>
                  </Sheet>
                )
              })}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold">Completadas</h2>
            <div className="space-y-2">
              {completed.map(g => (
                <Card key={g.id} className="bg-green-50 dark:bg-green-900/10"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle className="h-5 w-5"/></div><div><p className="font-medium">{g.name}</p><p className="text-xs text-gray-500">{formatDate(g.targetDate,'short')} · {formatCurrency(g.targetAmount)}</p></div></div></CardContent></Card>
              ))}
            </div>
          </section>
        )}

        {!active.length && !completed.length && (
          <Card><CardContent className="py-12 text-center"><Target className="h-12 w-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Sin metas</p><Button onClick={()=>setFormOpen(true)} className="mt-3" size="lg"><Plus className="h-4 w-4 mr-2"/>Crear Meta</Button></CardContent></Card>
        )}
      </div>
    </MobileLayout>
  )
}