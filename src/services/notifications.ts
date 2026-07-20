export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[CYBERPUNK] SW registered', registration)
      return registration
    } catch (error) {
      console.log('[CYBERPUNK] SW registration failed', error)
    }
  }
}

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options
      })
    })
  }
}

export const checkNewBounties = (storedBounties: any[], newBounties: any[]) => {
  const newHighValue = newBounties.filter(nb => 
    !storedBounties.find(sb => sb.id === nb.id) && nb.payout >= 10000
  )
  
  if (newHighValue.length > 0) {
    showNotification(`🚨 ${newHighValue.length} Nuovi bounty >$10k!`, {
      body: newHighValue.map(b => `${b.titolo} - $${b.payout}`).join('\n'),
      tag: 'new-bounties',
      requireInteraction: true
    })
  }
}