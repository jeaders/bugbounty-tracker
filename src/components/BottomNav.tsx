import { memo } from 'react'

export type NavSection = 'bounties' | 'programs' | 'recon' | 'academy' | 'dashboard'

interface Props {
  active: NavSection
  onChange: (section: NavSection) => void
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: string }> = [
  { id: 'bounties', label: 'Bounty', icon: '🎯' },
  { id: 'programs', label: 'Programmi', icon: '🗂️' },
  { id: 'recon', label: 'Recon', icon: '🔍' },
  { id: 'academy', label: 'Academy', icon: '🎓' },
  { id: 'dashboard', label: 'Profilo', icon: '👤' }
]

export const BottomNav = memo(({ active, onChange }: Props) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-black/95 backdrop-blur-md border-t border-cyan-500/30 safe-area-inset-bottom"
      aria-label="Navigazione principale"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 py-2 rounded-lg transition-all touch-manipulation ${
                isActive
                  ? 'text-neon-pink bg-cyan-500/10'
                  : 'text-cyan-500 active:bg-cyan-500/5'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`text-xl leading-none ${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-cyber mt-1 truncate w-full text-center ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
})
BottomNav.displayName = 'BottomNav'
