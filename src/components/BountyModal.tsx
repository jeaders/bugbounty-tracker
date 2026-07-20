import React, { useEffect } from 'react'
import { BugBounty } from '../types'

interface Props {
  bounty: BugBounty
  onClose: () => void
}

export const BountyModal = ({ bounty, onClose }: Props) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="cyber-card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-cyber text-neon-pink neon-glow">{bounty.titolo}</h2>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-neon-pink text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-cyan-600 text-sm">Programma:</span>
            <p className="font-cyber text-neon-blue">{bounty.programma}</p>
          </div>
          <div>
            <span className="text-cyan-600 text-sm">Payout Massimo:</span>
            <p className="font-cyber text-neon-green text-2xl">${bounty.payout.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-cyan-600 text-sm">Severità:</span>
            <p className="font-cyber capitalize">{bounty.severita}</p>
          </div>
          <div>
            <span className="text-cyan-600 text-sm">Asset Type:</span>
            <p className="font-cyber capitalize">{bounty.assetType}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-cyber text-neon-pink mb-2">Descrizione</h3>
          <p className="text-cyan-300">{bounty.descrizione}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-cyber text-neon-pink mb-2">Link Programma</h3>
          <a
            href={bounty.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cyber-button inline-block"
          >
            VISITA PROGRAMMA
          </a>
        </div>

        <div>
          <h3 className="text-lg font-cyber text-neon-pink mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {bounty.tags.map(tag => (
              <span key={tag} className="cyber-badge">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}