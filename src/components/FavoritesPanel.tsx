import React from 'react'
import { BugBounty } from '../types'

interface Props {
  favorites: string[]
  bounties: BugBounty[]
  onToggle: (id: string) => void
}

export const FavoritesPanel = ({ favorites, bounties, onToggle }: Props) => {
  const favoriteBounties = bounties.filter(b => favorites.includes(b.id))

  if (favorites.length === 0) return null

  return (
    <div className="cyber-card mt-4">
      <h3 className="text-lg font-cyber text-neon-pink mb-3 neon-glow">PREFERITI ({favorites.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {favoriteBounties.map(bounty => (
          <div key={bounty.id} className="flex items-center justify-between text-sm bg-black/30 p-2 rounded-lg">
            <span className="truncate flex-1">{bounty.titolo}</span>
            <button
              onClick={() => onToggle(bounty.id)}
              className="text-neon-pink hover:text-red-400 ml-2"
            >
              ★
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}