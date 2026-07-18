import React from 'react'
import { BugBounty } from '../types'

interface Props {
  bounties: BugBounty[]
}

export const StatsPanel = ({ bounties }: Props) => {
  const totalBounties = bounties.length
  const totalPayout = bounties.reduce((sum, b) => sum + b.payout, 0)
  const avgPayout = totalBounties > 0 ? Math.round(totalPayout / totalBounties) : 0
  const maxPayout = bounties.reduce((max, b) => Math.max(max, b.payout), 0)
  
  const bySeverity = bounties.reduce((acc, b) => {
    acc[b.severita] = (acc[b.severita] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="cyber-card mb-8">
      <h2 className="text-xl font-cyber text-neon-pink mb-6 neon-glow border-b border-cyan-500/30 pb-3">
        DASHBOARD STATISTICHE
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-5 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-neon-green/50 transition-all">
          <div className="text-3xl font-cyber font-bold text-neon-green glow-text">{totalBounties}</div>
          <div className="text-xs text-cyan-500 mt-1 font-mono uppercase">Bounty Totali</div>
        </div>
        
        <div className="text-center p-5 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-neon-blue/50 transition-all">
          <div className="text-3xl font-cyber font-bold text-neon-blue glow-text">${avgPayout.toLocaleString()}</div>
          <div className="text-xs text-cyan-500 mt-1 font-mono uppercase">Payout Medio</div>
        </div>
        
        <div className="text-center p-5 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-red-500/50 transition-all">
          <div className="text-3xl font-cyber font-bold text-red-400 glow-text">{bySeverity.critical || 0}</div>
          <div className="text-xs text-cyan-500 mt-1 font-mono uppercase">Critici</div>
        </div>
        
        <div className="text-center p-5 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-neon-pink/50 transition-all">
          <div className="text-3xl font-cyber font-bold text-neon-pink glow-text">${maxPayout.toLocaleString()}</div>
          <div className="text-xs text-cyan-500 mt-1 font-mono uppercase">Payout Massimo</div>
        </div>
      </div>
    </div>
  )
}