'use client'

import { useEffect, useState } from 'react'
import { SparkChat } from '@/components/ai-spark/SparkChat'
import { SparkCarousel } from '@/components/ai-spark/SparkCard'
import { useSpark } from '@/hooks/useSpark'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Clock, Calendar, TrendingUp, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { motion } from 'framer-motion'

export default function AISparkPage() {
  const { sparks, loading: sparksLoading, refreshSparks, dismissSpark, completeSpark } = useSpark()
  const [activeTab, setActiveTab] = useState<'chat' | 'sparks' | 'history'>('chat')

  useEffect(() => {
    refreshSparks()
  }, [refreshSparks])

  const stats = {
    total: sparks.length,
    completed: sparks.filter(s => s.completed).length,
    dismissed: sparks.filter(s => s.dismissed).length,
    pending: sparks.filter(s => !s.completed && !s.dismissed).length,
    weekly: sparks.filter(s => s.type === 'weekly_review').length,
  }

  const history = sparks.filter(s => s.completed || s.dismissed)
  const pending = sparks.filter(s => !s.dismissed && !s.completed)

  return (

      <div className="p-4 space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="h-6 w-6 text-purple-500">✨</span>
                Meta Muse Spark
              </h1>
              <p className="text-sm text-gray-500">
                {format(new Date(), 'EEEE, d MMMM', { locale: es })}
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
              <Sparkles className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
              <CheckCircle className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.completed}</p>
              <p className="text-[10px] text-gray-500">Listos</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
              <Zap className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.pending}</p>
              <p className="text-[10px] text-gray-500">Pendientes</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <TrendingUp className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.weekly}</p>
              <p className="text-[10px] text-gray-500">Semanal</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'chat' | 'sparks' | 'history')} className="w-full">
            <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="chat">
                <Sparkles className="h-4 w-4 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="sparks">
                <Zap className="h-4 w-4 mr-1" />
                Sparks
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-1" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 h-[60vh]">
              <SparkChat />
            </TabsContent>

            <TabsContent value="sparks" className="mt-4">
              <SparkCarousel
                sparks={sparks}
                onDismiss={dismissSpark}
                onComplete={completeSpark}
                onAction={spark => alert('Acción: ' + (spark.action?.label || ''))}
              />

              {pending.length === 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-3 inline-block">✨</span>
                  <h3 className="font-semibold mb-1">¡Todo al día!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    No hay sparks pendientes. Vuelve mañana para nuevos insights.
                  </p>
                  <Button onClick={() => setActiveTab('chat')} size="sm">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Pregúntame algo
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {history.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Sin historial aún</h3>
                  <p className="text-sm text-gray-500">Completa sparks para verlos aquí</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(spark => (
                    <div
                      key={spark.id}
                      className="p-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
                          {spark.type === 'celebration' && '🏆'}
                          {spark.type === 'micro_challenge' && '⚡'}
                          {spark.type === 'pattern_alert' && '🔍'}
                          {spark.type === 'goal_suggestion' && '🎯'}
                          {spark.type === 'micro_lesson' && '📚'}
                          {spark.type === 'weekly_review' && '📊'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{spark.title}</p>
                          <p className="text-xs text-gray-500 truncate">{spark.message.slice(0, 60)}</p>
                        </div>
                      </div>
                      <Badge variant={spark.completed ? 'success' : 'secondary'} className="text-xs flex-shrink-0">
                        {spark.completed ? 'Completado' : 'Descartado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>

  )
}
