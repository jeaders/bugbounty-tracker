import { memo, useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 min-touch-target bg-black/90 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 text-xl safe-padding"
        aria-label="Apri menu"
      >
        ☰
      </button>
      
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`lg:flex lg:flex-col fixed inset-y-0 z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-64 bg-black/95 backdrop-blur-md border-r border-cyan-500/30 p-4 safe-padding`}>
        <div className="mb-6 mt-16 lg:mt-0">
          <h1 className="text-xl font-cyber bg-gradient-to-r from-neon-pink to-cyan-400 bg-clip-text text-transparent">
            BUG BOUNTY
          </h1>
          <p className="text-cyan-500 text-xs font-mono mt-1">TRACKER v2.0</p>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Navigazione principale">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-4 rounded-xl transition-all flex items-center gap-3 min-touch-target ${
                  isActive
                    ? 'bg-cyan-500/15 border-l-2 border-neon-pink text-neon-pink'
                    : 'text-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-300 border-l-2 border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-cyber text-base ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] font-mono opacity-60 mt-1">
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {metadata && (
          <div className="mt-auto pt-4 border-t border-cyan-500/20">
            <div className="text-[10px] font-mono text-cyan-600 mb-2">DATABASE STATS</div>
            <div className="space-y-1 text-sm font-mono px-2">
              <div className="flex justify-between">
                <span className="text-cyan-500">Bounty:</span>
                <span className="text-neon-green font-bold">{metadata.totalBounties}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-500">Payout:</span>
                <span className="text-neon-pink font-bold">${metadata.totalPayout.toLocaleString()}</span>
              </div>
              <div className="text-cyan-700 text-[11px] mt-2">
                Aggiornato: {new Date(metadata.lastUpdate).toLocaleDateString('it-IT')}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
})
Sidebar.displayName = 'Sidebar'