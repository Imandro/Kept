'use client'

import { useState, useEffect } from 'react'
import { Spark, SparkMessage, ActionResult } from '@/lib/ai/types'

interface UseSparkReturn {
  sparks: Spark[]
  messages: SparkMessage[]
  loading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  executeAction: (actionType: string, params: any) => Promise<ActionResult>
  dismissSpark: (sparkId: string) => void
  completeSpark: (sparkId: string) => void
  refreshSparks: () => Promise<void>
}

export function useSpark(): UseSparkReturn {
  const [sparks, setSparks] = useState<Spark[]>([])
  const [messages, setMessages] = useState<SparkMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSparks = async () => {
    try {
      const res = await fetch('/api/ai/spark/spark')
      if (res.ok) {
        const data = await res.json()
        setSparks(data.sparks || [])
      }
    } catch (err) {
      console.error('Error fetching sparks:', err)
    }
  }

  useEffect(() => {
    fetchSparks()
  }, [])

  const sendMessage = async (message: string) => {
    setLoading(true)
    setError(null)
    
    const userMessage: SparkMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch('/api/ai/spark/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      })
      
      if (!res.ok) throw new Error('Error en el chat')
      
      const data = await res.json()
      
      const assistantMessage: SparkMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          actionExecuted: data.actionExecuted,
          sparksGenerated: data.sparksGenerated,
        },
      }
      setMessages(prev => [...prev, assistantMessage])
      
      // Actualizar sparks si se generaron nuevos
      if (data.sparksGenerated?.length) {
        setSparks(prev => [...data.sparksGenerated, ...prev.filter(s => !s.dismissed)])
      }
      
      // Refrescar sparks si hubo acción
      if (data.actionExecuted) {
        fetchSparks()
      }
    } catch (err: any) {
      setError(err.message)
      const errorMessage: SparkMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (actionType: string, params: any) => {
    try {
      const res = await fetch('/api/ai/spark/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, params }),
      })
      const result = await res.json()
      
      if (result.success) {
        // Refrescar sparks tras acción exitosa
        fetchSparks()
      }
      return result
    } catch (err: any) {
      return { success: false, error: err.message } as any
    }
  }

  const dismissSpark = (sparkId: string) => {
    setSparks(prev => prev.map(s => s.id === sparkId ? { ...s, dismissed: true } : s))
  }

  const completeSpark = (sparkId: string) => {
    setSparks(prev => prev.map(s => s.id === sparkId ? { ...s, completed: true } : s))
  }

  const refreshSparks = fetchSparks

  return {
    sparks,
    messages,
    loading,
    error,
    sendMessage,
    executeAction,
    dismissSpark,
    completeSpark,
    refreshSparks,
  }
}