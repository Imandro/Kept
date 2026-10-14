import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ToastProvider } from '@/components/ui/toast'
import { useEffect, useState } from 'react'
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

  const [persister] = useState(() => createSyncStoragePersister({
    storage: window.localStorage,
    throttleTime: 1000 * 60,
  }))

  useEffect(() => {
    startSyncEngine()
    return () => stopSyncEngine()
  }, [])

  return (
    <SessionProvider>
      <PersistQueryClientProvider client={queryClient} persister={persister} maxAge={1000 * 60 * 60 * 24}>
        <QueryClientProvider client={queryClient}>
          <SWRegistration />
          {children}
          <ToastProvider />
        </QueryClientProvider>
      </PersistQueryClientProvider>
    </SessionProvider>
  )
}