import React from 'react'
import { BugBounty, Filter } from '../types'

interface Props {
  bounties: BugBounty[]
  filters: Filter
  onSelect?: (bounty: BugBounty) => void
  favorites?: string[]
  onToggleFavorite?: (id: string) => void
}

export const BountyList = ({ bounties, filters, onSelect, favorites = [], onToggleFavorite }: Props) => {
  const filtered = bounties.filter(bounty => {
    if (bounty.payout < filters.payoutMin || bounty.payout > filters.payoutMax) return false
    if (filters.severita.length > 0 && !filters.severita.includes(bounty.severita)) return false
    if (filters.assetType.length > 0 && !filters.assetType.includes(bounty.assetType)) return false
    if (filters.programma && !bounty.programma.toLowerCase().includes(filters.programma.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-cyan-500/30">
        <h2 className="text-2xl font-cyber text-neon-pink neon-glow">
          BOUNTY DISPONIBILI
        </h2>
        <span className="text-cyan-500 font-mono text-lg bg-black/50 px-4 py-1.5 rounded-lg border border-cyan-500/30">
          {filtered.length} risultati
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="cyber-card text-center py-16">
          <p className="text-cyan-500 text-lg">Nessun bounty trovato con i filtri selezionati</p>
          <p className="text-cyan-700 text-sm mt-2">Modifica i filtri o riprova più tardi</p>
        </div>
      ) : (
        filtered.map(bounty => (
          <BountyCard 
            key={bounty.id} 
            bounty={bounty} 
            isFavorite={favorites.includes(bounty.id)}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))
      )}
    </div>
  )
}

const BountyCard = ({ 
  bounty, 
  isFavorite, 
  onSelect, 
  onToggleFavorite 
}: { 
  bounty: BugBounty
  isFavorite?: boolean
  onSelect?: (bounty: BugBounty) => void
  onToggleFavorite?: (id: string) => void
}) => {
  const severitaColors: Record<string, string> = {
    critical: 'border-red-500/50 text-red-400 shadow-red-500/20',
    high: 'border-orange-500/50 text-orange-400 shadow-orange-500/20',
    medium: 'border-yellow-500/50 text-yellow-400 shadow-yellow-500/20',
    low: 'border-green-500/50 text-green-400 shadow-green-500/20',
    informational: 'border-blue-500/50 text-blue-400 shadow-blue-500/20'
  }

  return (
    <div 
      className="cyber-card group cursor-pointer"
      onClick={() => onSelect?.(bounty)}
    >
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-cyber text-neon-pink group-hover:text-neon-blue transition-colors">
              {bounty.titolo}
            </h3>
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(bounty.id)
                }}
                className={`ml-2 text-lg ${isFavorite ? 'text-neon-pink' : 'text-cyan-500'}`}
              >
                ★
              </button>
            )}
          </div>
          <p className="text-cyan-500 text-sm mt-1 font-mono">{bounty.programma}</p>
          <p className="text-sm text-cyan-600 mt-2 leading-relaxed">{bounty.descrizione}</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`cyber-badge ${severitaColors[bounty.severita]}`}>
              {bounty.severita.toUpperCase()}
            </span>
            <span className="cyber-badge border-neon-blue/50 text-neon-blue">
              {bounty.assetType.toUpperCase()}
            </span>
            {bounty.tags.slice(0, 3).map(tag => (
              <span key={tag} className="cyber-badge border-cyan-500/30 text-cyan-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex md:flex-col justify-between md:items-end md:text-right gap-3">
          <div>
            <div className="text-3xl font-cyber text-neon-green">
              ${bounty.payout.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-600 mt-1">PAYOUT MAX</div>
          </div>
          <a
            href={bounty.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="cyber-button px-6 py-2.5 text-sm touch-manipulation"
          >
            VISITA PROGRAMMA
          </a>
        </div>
      </div>
    </div>
  )
}