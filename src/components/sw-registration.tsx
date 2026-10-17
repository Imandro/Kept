'use client'

import { useEffect } from 'react'

export function SWRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered:', reg.scope)

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Nueva versión disponible. ¿Recargar?')) {
                window.location.reload()
              }
            }
          })
        }
      })
    }).catch(err => console.log('SW registration failed:', err))
  }, [])

  return null
}