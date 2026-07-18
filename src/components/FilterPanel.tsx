import React, { useState } from 'react'
import { Filter, Severita, AssetType } from '../types'
import { SeveritaBadge } from './SeveritaBadge'

interface Props {
  filters: Filter
  setFilters: (filters: Filter) => void
}

const severitaOptions: Severita[] = ['critical', 'high', 'medium', 'low', 'informational']
const assetOptions: AssetType[] = ['web', 'mobile', 'api', 'infrastructure', 'hardware', 'other']

export const FilterPanel = ({ filters, setFilters }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSeverita = (sev: Severita) => {
    const newSeverita = filters.severita.includes(sev)
      ? filters.severita.filter(s => s !== sev)
      : [...filters.severita, sev]
    setFilters({ ...filters, severita: newSeverita })
  }

  const toggleAssetType = (type: AssetType) => {
    const newType = filters.assetType.includes(type)
      ? filters.assetType.filter(t => t !== type)
      : [...filters.assetType, type]
    setFilters({ ...filters, assetType: newType })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden cyber-button w-full mb-4 text-sm py-3 font-cyber neon-glow"
      >
        FILTRI {isOpen ? '▼' : '▶'}
      </button>

      <div className={`cyber-card ${isOpen ? 'block' : 'hidden'} lg:block space-y-5`}>
        <h2 className="text-xl font-cyber text-neon-pink neon-glow pb-3 border-b border-cyan-500/30">
          FILTRI AVANZATI
        </h2>
        
        <div>
          <label className="block text-sm mb-2 font-cyber text-cyan-400">Programma</label>
          <input
            type="text"
            placeholder="Ricerca programma..."
            className="cyber-input w-full"
            value={filters.programma}
            onChange={(e) => setFilters({ ...filters, programma: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 font-cyber text-cyan-400">Payout Min</label>
            <input
              type="number"
              className="cyber-input w-full"
              value={filters.payoutMin || ''}
              onChange={(e) => setFilters({ ...filters, payoutMin: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-cyber text-cyan-400">Payout Max</label>
            <input
              type="number"
              className="cyber-input w-full"
              value={filters.payoutMax || ''}
              onChange={(e) => setFilters({ ...filters, payoutMax: Number(e.target.value) || 100000 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-3 font-cyber text-cyan-400">Severità</label>
          <div className="grid grid-cols-2 gap-2">
            {severitaOptions.map(sev => (
              <button
                key={sev}
                onClick={() => toggleSeverita(sev)}
                className={`cyber-badge text-center transition-all duration-200 ${
                  filters.severita.includes(sev)
                    ? 'bg-neon-pink/20 border-neon-pink text-neon-pink shadow-neon-pink/30'
                    : 'bg-black/30 border-cyan-500/30 text-cyan-400 hover:border-neon-pink/50'
                }`}
              >
                <SeveritaBadge severita={sev} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-3 font-cyber text-cyan-400">Asset Type</label>
          <div className="grid grid-cols-2 gap-2">
            {assetOptions.map(type => (
              <button
                key={type}
                onClick={() => toggleAssetType(type)}
                className={`cyber-badge text-center capitalize transition-all duration-200 ${
                  filters.assetType.includes(type)
                    ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-neon-blue/30'
                    : 'bg-black/30 border-cyan-500/30 text-cyan-400 hover:border-neon-blue/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setFilters({ payoutMin: 0, payoutMax: 100000, severita: [], assetType: [], programma: '' })}
          className="cyber-button w-full py-3 font-cyber text-sm touch-manipulation"
        >
          RESET FILTRI
        </button>
      </div>
    </>
  )
}