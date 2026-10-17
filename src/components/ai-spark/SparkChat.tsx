'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSpark } from '@/hooks/useSpark'
import { cn } from '@/lib/utils'
import { Send, Sparkles, CheckCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'

export function SparkChat() {
  const { messages, loading, sendMessage, error } = useSpark()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const suggestions = [
    '¿Cómo voy este mes?',
    'Gasté $150 en súper',
    'Crear meta viaje $20000',
    'Analiza mis patrones',
    'Crear presupuesto $2000 comida',
    'Aportar $500 a meta emergencia',
  ]

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
    setShowSuggestions(false)
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
    setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Meta Muse Spark</h2>
          <p className="text-[11px] text-gray-500">Pregunta, actúa, crece</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && showSuggestions && (
          <div className="space-y-4">
            <div className="text-center py-6 text-gray-500">
              <Sparkles className="h-10 w-10 text-purple-500 mx-auto mb-3" />
              <p className="text-sm">¡Hola! Soy tu musa financiera.</p>
              <p className="text-xs mt-1">Pregúntame o elige una sugerencia:</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestion(s)}
                  className="w-full py-2.5 px-3 text-xs text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.metadata?.actionExecuted && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    <span>Acción ejecutada: {msg.metadata.actionExecuted.message}</span>
                  </div>
                </div>
              )}
              {msg.metadata?.sparksGenerated && msg.metadata.sparksGenerated.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">✨ Sparks generados:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.metadata.sparksGenerated.slice(0, 3).map((s: any) => (
                      <span
                        key={s.id}
                        className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                      >
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 max-w-[85%] w-40">
              <div className="space-y-2">
                <motion.div
                  className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div
                  className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, delay: 0.2, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <X className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
