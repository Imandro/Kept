'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect, useState } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ToastProvider } from '@/components/ui/toast'
import { startSyncEngine, stopSyncEngine } from '@/lib/sync'
import { SWRegistration } from '@/components/sw-registration'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  }))

  const [persister] = useState(() => {
    if (typeof window === 'undefined') {
      const noopStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
      return createSyncStoragePersister({
        storage: noopStorage as any,
        throttleTime: 1000 * 60,
      })
    }
    return createSyncStoragePersister({
      storage: window.localStorage,
      throttleTime: 1000 * 60,
    })
  })

  useEffect(() => {
    startSyncEngine()
    return () => {
      void stopSyncEngine()
    }
  }, [])

  return (
    <SessionProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <SWRegistration />
        {children}
        <ToastProvider />
      </PersistQueryClientProvider>
    </SessionProvider>
  )
}
