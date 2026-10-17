'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/mobile-layout'
import { SparkChat } from '@/components/ai-spark/SparkChat'
import { SparkCarousel } from '@/components/ai-spark/SparkCard'
import { useSpark } from '@/hooks/useSpark'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Target, Trophy, BookOpen, Flame, Clock, Calendar, TrendingUp, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FadeIn, SlideUp, ScaleIn, StaggerContainer, StaggerItem, motion } from '@/components/ui/animated'
import { cn } from '@/lib/utils'

export default function AISparkPage() {
  const { sparks, loading: sparksLoading, refreshSparks, dismissSpark, completeSpark } = useSpark()
  const [activeTab, setActiveTab] = useState<'chat' | 'sparks' | 'history'>('chat')
  const [showWeekly, setShowWeekly] = useState(false)

  useEffect(() => {
    refreshSparks()
  }, [refreshSparks])

  const stats = {
    total: sparks.length,
    completed: sparks.filter(s => s.completed).length,
    dismissed: sparks.filter(s => s.dismissed).length,
    pending: sparks.filter(s => !s.completed && !s.dismissed).length,
  }

  const tabClass = (tab: string) => 
    activeTab === tab 
      ? 'flex-1 py-2 px-4 rounded-lg font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600'
      : 'flex-1 py-2 px-4 rounded-lg font-medium text-gray-600'

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="h-6 w-6 text-purple-500">✨</span>
                Meta Muse Spark
              </h1>
              <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowWeekly(true)}>
              <Calendar className="h-4 w-4 mr-1" />
              Semanal
            </Button>
          </div>
        </FadeIn>

        {/* Stats Bar */}
        <FadeIn delay={0.1}>
          <StaggerContainer stagger={0.08}>
            <StaggerItem>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                <Sparkles className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completados</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                <span className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pendientes</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <TrendingUp className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{sparks.filter(s => s.type === 'weekly_review').length}</p>
                <p className="text-xs text-gray-500">Semanales</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>

        {/* Tabs */}
        <FadeIn delay={0.2}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="chat"><Sparkles className="h-4 w-4 mr-1" />Chat</TabsTrigger>
              <TabsTrigger value="sparks"><Zap className="h-4 w-4 mr-1" />Sparks</TabsTrigger>
              <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" />Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 h-[60vh]">
              <FadeIn>
                <SparkChat />
              </FadeIn>
            </TabsContent>

            <TabsContent value="sparks" className="mt-4">
              <FadeIn>
                <SparkCarousel 
                  sparks={sparks} 
                  onDismiss={dismissSpark} 
                  onComplete={dismissSpark} 
                  onAction={(spark) => alert(`Acción: ${spark.action?.label}`)} 
                />
                
                {sparks.filter(s => !s.dismissed && !s.completed).length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="text-4xl mb-3 inline-block"
                    >
                      ✨
                    </motion.span>
                    <h3 className="font-semibold mb-1">¡Todo al día!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      No hay sparks pendientes. Vuelve mañana para nuevos insights.
                    </p>
                    <Button onClick={() => setActiveTab('chat')} size="sm">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Pregúntame algo
                    </Button>
                  </motion.div>
                )}
              </FadeIn>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <FadeIn>
                <div className="space-y-3">
                  {sparks.filter(s => s.completed || s.dismissed).length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Sin historial aún</h3>
                      <p className="text-sm text-gray-500">Completa sparks para verlos aquí</p>
                    </div>
                  ) : (
                    <StaggerContainer stagger={0.05}>
                      {sparks.filter(s => s.completed || s.dismissed).map(spark => (
                        <StaggerItem key={spark.id}>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                                {spark.type === 'celebration' && '🏆'}
                                {spark.type === 'micro_challenge' && '⚡'}
                                {spark.type === 'pattern_alert' && '🔍'}
                                {spark.type === 'goal_suggestion' && '🎯'}
                                {spark.type === 'micro_lesson' && '📚'}
                                {spark.type === 'weekly_review' && '📊'}
                              </span>
                              <div>
                                <p className="font-medium text-sm">{spark.title}</p>
                                <p className="text-xs text-gray-500">{spark.message.slice(0, 60)}...</p>
                              </div>
                            </div>
                            <Badge variant={spark.completed ? 'success' : 'secondary'} className="text-xs">
                              {spark.completed ? 'Completado' : 'Descartado'}
                            </Badge>
                          </motion.div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  )}
                </FadeIn>
              </TabsContent>
            </Tabs>
          </div>
        </MobileLayout>
      )
    )
  }
}