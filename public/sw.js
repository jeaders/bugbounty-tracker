// Bug Bounty Tracker Service Worker
// Strategie di cache:
// - HTML/JS/CSS: network-first con fallback cache (per avere aggiornamenti rapidi)
// - Bounties JSON: stale-while-revalidate (mostra subito, aggiorna in background)
// - Icons/assets: cache-first (non cambiano mai)
// - API calls: network-only (no cache)

const CACHE_VERSION = 'bounty-tracker-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const BOUNTY_CACHE = `${CACHE_VERSION}-bounty`

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignora se qualche asset manca (es. icone non ancora generate)
        console.log('[SW] Alcuni asset statici non presenti, skip')
      }))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !key.startsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API: network only, mai in cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })))
    return
  }

  // Bounties JSON: stale-while-revalidate
  if (url.pathname === '/bounties.json' || url.pathname === '/bounties-meta.json') {
    event.respondWith(staleWhileRevalidate(request, BOUNTY_CACHE))
    return
  }

  // Asset statici (immagini, font): cache-first
  if (request.destination === 'image' || request.destination === 'font' || url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // HTML/JS/CSS: network-first con fallback cache
  if (request.destination === 'document' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // Default: prova network, fallback cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Strategie di caching
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback SPA: index.html per navigazioni
    if (request.destination === 'document') {
      return caches.match('/index.html')
    }
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)

  return cached || fetchPromise
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: '🐛 Nuovo Bounty!', body: 'Controlla il tracker', url: '/' }
  try {
    if (event.data) data = event.data.json()
  } catch (e) {
    if (event.data) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'bounty-notification',
      data: { url: data.url || '/' },
      requireInteraction: data.requireInteraction || false,
      actions: [
        { action: 'open', title: '🔍 Apri' },
        { action: 'close', title: '✕ Chiudi' }
      ]
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'close') return

  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Se c'è già una finestra aperta, focalizzala
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Altrimenti apri nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background sync (per futuri aggiornamenti)
self.addEventListener('sync', (event) => {
  if (event.tag === 'refresh-bounties') {
    event.waitUntil(
      fetch('/bounties-meta.json').then(r => r.json()).catch(() => null)
    )
  }
})
