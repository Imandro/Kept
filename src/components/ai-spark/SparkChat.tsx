'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSpark } from '@/hooks/useSpark'
import { SparkMessage } from '@/lib/ai/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Sparkles, Zap, CheckCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/animated'
import { cn } from '@/lib/utils'

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
    setInput(text)
    sendMessage(text)
    setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 backdrop-blur sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Meta Muse Spark</h1>
            <p className="text-xs text-gray-500">Tu musa financiera • Pregunta, actúa, crece</p>
          </div>
        </motion.div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        <AnimatePresence mode="wait">
          {messages.length === 0 && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="text-center py-8 text-gray-500">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="mx-auto mb-3"
                >
                  <Sparkles className="h-12 w-12 text-purple-500" />
                </motion.div>
                <p className="text-sm">¡Hola! Soy tu musa financiera.</p>
                <p className="text-xs mt-1">Pregúntame cualquier cosa o elige una sugerencia:</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestion(s)}
                    className="h-auto py-3 text-xs justify-start text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn('max-w-[85%] rounded-2xl px-4 py-3', 
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.metadata?.actionExecuted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                      <CheckCircle className="h-3 w-3" />
                      <span>Acción ejecutada: {msg.metadata.actionExecuted.message}</span>
                    </div>
                  </motion.div>
                )}
                {msg.metadata?.sparksGenerated && msg.metadata.sparksGenerated.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">✨ Sparks generados:</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.metadata.sparksGenerated.slice(0, 3).map((s: any) => (
                        <motion.span
                          key={s.id}
                          whileHover={{ scale: 1.05 }}
                          className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                        >
                          {s.title}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
              {msg.role === 'assistant' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              )}
            </motion.div>
          ))}

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 max-w-[85%]">
                  <div className="flex gap-2">
                    <motion.div
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
                      animate={{ width: ['100%', '50%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"
                      animate={{ width: ['100%', '50%', '100%'] }}
                      transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Error Banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center justify-between"
            >
              <span>{error}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                variant="ghost" size="icon" onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur"
        >
          <form onSubmit={handleSubmit} className="flex gap-2">
            <motion.div
              whileFocusWithin={{ scale: 1.01 }}
              className="flex-1 relative"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pregúntame: 'Gasté $50 en café', 'Crear meta viaje $10k', '¿Cómo voy?'..."
                className="flex-1 pr-12"
                disabled={loading}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-primary"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    )
  )
}