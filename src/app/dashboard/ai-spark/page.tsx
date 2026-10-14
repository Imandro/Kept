'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/mobile-layout'
import { SparkChat } from '@/components/ai-spark/SparkChat'
import { SparkCarousel } from '@/components/ai-spark/SparkCard'
import { useSpark } from '@/hooks/useSpark'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AISparkPage() {
  const { sparks, refreshSparks, dismissSpark, completeSpark } = useSpark()
  const [activeTab, setActiveTab] = useState<'chat' | 'sparks' | 'history'>('chat')

  useEffect(() => {
    refreshSparks()
  }, [refreshSparks])

  const tabClass = (tab: string) => 
    activeTab === tab 
      ? 'flex-1 py-2 px-4 rounded-lg font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600'
      : 'flex-1 py-2 px-4 rounded-lg font-medium text-gray-600'

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="h-6 w-6 text-purple-500">✨</span>
              Meta Muse Spark
            </h1>
            <p className="text-sm text-gray-500">Tu musa financiera</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{sparks.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{sparks.filter(s => s.completed).length}</div>
            <div className="text-xs text-gray-500">Completados</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{sparks.filter(s => !s.completed && !s.dismissed).length}</div>
            <div className="text-xs text-gray-500">Pendientes</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{sparks.filter(s => s.type === 'weekly_review').length}</div>
            <div className="text-xs text-gray-500">Semanales</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button onClick={() => setActiveTab('chat')} className={tabClass('chat')}>Chat</button>
            <button onClick={() => setActiveTab('sparks')} className={tabClass('sparks')}>Sparks</button>
            <button onClick={() => setActiveTab('history')} className={tabClass('history')}>Historial</button>
          </div>

          {activeTab === 'chat' && <div className="h-[60vh]"><SparkChat /></div>}
          
          {activeTab === 'sparks' && (
            <div className="space-y-4">
              <SparkCarousel 
                sparks={sparks} 
                onDismiss={dismissSpark} 
                onComplete={dismissSpark} 
                onAction={(spark) => alert(`Acción: ${spark.action?.label}`)} 
              />
              
              {sparks.filter(s => !s.dismissed && !s.completed).length === 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-semibold mb-1">¡Todo al día!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">No hay sparks pendientes</p>
                  <button onClick={() => setActiveTab('chat')} className="text-sm text-purple-600 hover:underline">Pregúntame algo</button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-3 text-center text-gray-500 py-6">
              <p>Historial próximamente</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}