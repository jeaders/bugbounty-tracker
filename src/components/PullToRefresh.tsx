import { memo, useRef, useState, useCallback, ReactNode } from 'react'

interface Props {
  onRefresh: () => Promise<void> | void
  children: ReactNode
}

const PULL_THRESHOLD = 80

export const PullToRefresh = memo(({ onRefresh, children }: Props) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    } else {
      startY.current = -1
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === -1 || isRefreshing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0 && diff < PULL_THRESHOLD * 2) {
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5))
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === -1) return
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(PULL_THRESHOLD)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        startY.current = -1
      }
    } else {
      setPullDistance(0)
      startY.current = -1
    }
  }, [pullDistance, isRefreshing, onRefresh])

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-y-auto h-full overscroll-none"
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10 transition-opacity"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
        aria-hidden="true"
      >
        <div className={`text-cyan-400 font-cyber text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
          {isRefreshing ? '⟳ AGGIORNAMENTO...' : pullDistance >= PULL_THRESHOLD ? '↓ RILASCIA PER AGGIORNARE' : '↓ SCORRI PER AGGIORNARE'}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
})
PullToRefresh.displayName = 'PullToRefresh'
