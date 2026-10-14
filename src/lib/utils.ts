import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  currency: string = 'MXN',
  locale: string = 'es-MX'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short',
  locale: string = 'es-MX'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'relative') {
    return formatRelativeTime(d, locale)
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format === 'short' ? 'short' : 'long',
  }).format(d)
}

export function formatRelativeTime(date: Date, locale: string = 'es-MX'): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 7) {
    return formatDate(date, 'short', locale)
  }
  if (diffDays > 0) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  }
  if (diffHours > 0) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  }
  if (diffMinutes > 0) {
    return `hace ${diffMinutes} min`
  }
  return 'ahora mismo'
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

export function getMonthName(month: number, locale: string = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, month, 1))
}

export function getWeekDays(locale: string = 'es-MX', firstDayOfWeek: number = 1): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const days = []
  const baseDate = new Date(2024, 0, 1) // Lunes 1 de enero 2024
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() + i + (firstDayOfWeek === 1 ? 0 : 1))
    days.push(formatter.format(date).replace('.', ''))
  }
  return days
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}