import { memo } from 'react'
import { NavSection } from './BottomNav'

interface Props {
  active: NavSection
  onChange: (section: NavSection) => void
  metadata?: { totalBounties: number; totalPayout: number; lastUpdate: string } | null
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: string; description: string }> = [
  { id: 'bounties', label: 'Bounty', icon: '🎯', description: 'Lista con filtri' },
  { id: 'programs', label: 'Programmi', icon: '🗂️', description: 'Catalogo per piattaforma' },
  { id: 'recon', label: 'Recon', icon: '🔍', description: 'Toolbox integrata' },
  { id: 'academy', label: 'Academy', icon: '🎓', description: 'Impara a cacciare' },
  { id: 'dashboard', label: 'Profilo', icon: '👤', description: 'I tuoi progressi' }
]

export const Sidebar = memo(({ active, onChange, metadata }: Props) => {
  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 w-64 bg-black/80 backdrop-blur-md border-r border-cyan-500/30 z-30 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-cyber bg-gradient-to-r from-neon-pink to-cyan-400 bg-clip-text text-transparent">
          BUG BOUNTY
        </h1>
        <p className="text-cyan-500 text-xs font-mono mt-1">TRACKER v2.0</p>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Navigazione principale desktop">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-start gap-3 group ${
                isActive
                  ? 'bg-cyan-500/15 border-l-2 border-neon-pink text-neon-pink'
                  : 'text-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-300 border-l-2 border-transparent'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-cyber text-sm ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </div>
                <div className="text-[10px] font-mono opacity-60 mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {metadata && (
        <div className="mt-auto pt-4 border-t border-cyan-500/20">
          <div className="text-[10px] font-mono text-cyan-600 mb-1">DATABASE STATS</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-cyan-500">Bounty:</span>
              <span className="text-neon-green font-bold">{metadata.totalBounties}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-500">Payout:</span>
              <span className="text-neon-pink font-bold">${metadata.totalPayout.toLocaleString()}</span>
            </div>
            <div className="text-cyan-700 text-[10px] mt-2">
              Aggiornato: {new Date(metadata.lastUpdate).toLocaleDateString('it-IT')}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
})
Sidebar.displayName = 'Sidebar'
