self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open('bounty-tracker-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ])
    })
  )
})

self.addEventListener('fetch', (event: any) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})

self.addEventListener('push', (event: any) => {
  const data = event.data?.json() || { title: 'Nuovo Bounty', body: 'Controlla il tracker' }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      tag: 'bounty-notification',
      data: data.url
    })
  )
})

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})