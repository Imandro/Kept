'use client'

import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label="Cambiar tema"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}