'use client'

import { useEffect } from 'react'

export function SWRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('SW registered:', reg.scope)
        
        // Escuchar updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                if (confirm('Nueva versión disponible. ¿Recargar?')) {
                  window.location.reload()
                }
              }
            })
          }
        })
      }).catch(err => console.log('SW registration failed:', err))
    }
  }, [])

  return null
}