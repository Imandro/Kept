'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
 theme: Theme
 resolved: 'light' | 'dark'
 setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'kept-theme'

function systemTheme(): 'light' | 'dark' {
 if (typeof window === 'undefined') return 'light'
 return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
 const [theme, setThemeState] = useState<Theme>('system')
 const [resolved, setResolved] = useState<'light' | 'dark'>('light')

 const apply = useCallback((t: Theme) => {
 const r = t === 'system' ? systemTheme() : t
 setResolved(r)
 const root = document.documentElement
 root.classList.remove('light', 'dark')
 root.classList.add(r)
 root.style.colorScheme = r
 }, [])

 useEffect(() => {
 const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'system'
 setThemeState(stored)
 apply(stored)

 const mq = window.matchMedia('(prefers-color-scheme: dark)')
 const onChange = () => {
 if ((localStorage.getItem(STORAGE_KEY) as Theme | null) === 'system' || !localStorage.getItem(STORAGE_KEY)) {
 apply('system')
 }
 }
 mq.addEventListener('change', onChange)
 return () => mq.removeEventListener('change', onChange)
 }, [apply])

 const setTheme = useCallback((t: Theme) => {
 setThemeState(t)
 localStorage.setItem(STORAGE_KEY, t)
 apply(t)
 }, [apply])

 return (
 <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
 {children}
 </ThemeContext.Provider>
 )
}

export function useTheme() {
 const ctx = useContext(ThemeContext)
 if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
 return ctx
}