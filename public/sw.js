/// <reference types="workbox-sw" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'kept-v2'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/transactions',
  '/dashboard/goals',
  '/dashboard/savings',
  '/dashboard/ai-spark',
  '/manifest.json',
]

// Install - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate - clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch - NetworkFirst para API, CacheFirst para assets
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls - NetworkFirst con fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Static assets - NetworkFirst (evita assets obsoletos tras deploy)
  if (request.method === 'GET' &&
      (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/) ||
       STATIC_ASSETS.includes(url.pathname))) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Navigation - NetworkFirst con offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Default - NetworkFirst
  event.respondWith(networkFirstStrategy(request))
})

async function networkFirstStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function navigationStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match('/dashboard')
    if (cached) return cached
    return new Response(
      `<!DOCTYPE html><html><head><title>Kept - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{font-family:system-ui;padding:2rem;text-align:center;background:#f8fafc}
      .icon{font-size:4rem;margin-bottom:1rem}</style></head>
      <body><div class="icon">📱</div><h1>Kept</h1><p>Estás offline. Los datos se sincronizarán al reconectar.</p>
      <button onclick="window.location.reload()">Reintentar</button></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Background Sync
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'kept-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync(): Promise<void> {
  console.log('Background sync triggered')
  // Notificar a clientes para procesar cola
  const clients = await self.clients.matchAll()
  clients.forEach(client => client.postMessage({ type: 'SYNC_TRIGGER' }))
}

// Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Descartar' },
    ],
  }
  
  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  if (event.action === 'dismiss') return
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      const url = event.notification.data.url
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})