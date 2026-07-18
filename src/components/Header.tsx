import React from 'react'
import { BountyMetadata } from '../services/bountyLoader'

interface Props {
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  metadata?: BountyMetadata | null
}

export const Header = ({ isDarkMode, setIsDarkMode, metadata }: Props) => {
  return (
    <header className={`relative py-8 sm:py-12 border-b-2 ${isDarkMode ? 'border-cyan-500/60 bg-black/90' : 'border-gray-300 bg-white/90'} backdrop-blur-md overflow-hidden`}>
      <div className="absolute inset-0 -z-10">
        <div className={`absolute w-96 h-96 ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-400/20'} rounded-full blur-3xl -top-48 -left-48 animate-pulse`}></div>
        <div className={`absolute w-96 h-96 ${isDarkMode ? 'bg-purple-500/15' : 'bg-purple-300/15'} rounded-full blur-3xl -bottom-48 -right-48 animate-pulse`} style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center text-center">
<h1 className={`text-3xl sm:text-4xl lg:text-5xl font-cyber text-center mb-2 bg-gradient-to-r ${isDarkMode ? 'from-neon-pink via-cyan-400 to-neon-green' : 'from-pink-500 via-blue-500 to-green-500'} bg-clip-text text-transparent ${isDarkMode ? 'glow-text' : ''} tracking-wider drop-shadow-lg`}>
             BUG BOUNTY TRACKER
          </h1>
          {metadata && (
            <div className={`mt-2 text-[10px] sm:text-xs font-mono ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>
              DB: {metadata.totalBounties} bounty · ${metadata.totalPayout.toLocaleString()} cumulato · ultimo aggiornamento {new Date(metadata.lastUpdate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <div className="flex items-center gap-3 mt-4">
            <div className={`flex items-center gap-3 px-4 py-1.5 ${isDarkMode ? 'bg-black/50 border-cyan-500/30' : 'bg-gray-100 border-gray-300'} rounded-full border`}>
              <span className={`w-3 h-3 ${isDarkMode ? 'bg-neon-green shadow-neon-green' : 'bg-green-500 shadow-green-400'} rounded-full animate-pulse shadow-lg`}></span>
              <span className={`font-mono text-sm ${isDarkMode ? 'text-cyan-400' : 'text-gray-700'}`}>LIVE MONITORING ACTIVE</span>
            </div>
<button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className={`ml-4 px-4 py-2 min-touch-target rounded-full border ${isDarkMode ? 'bg-black/50 border-cyan-500/30 text-cyan-400 hover:border-neon-pink' : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-pink-500'} transition-all font-cyber text-sm`}
            >
              {isDarkMode ? '☀️ MODALITÀ CHIARA' : '🌙 MODALITÀ SCURA'}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-cyan-400' : 'via-blue-500'} to-transparent shadow-lg`} style={{ boxShadow: isDarkMode ? '0 0 10px rgba(0, 255, 255, 0.5)' : '0 0 10px rgba(59, 130, 246, 0.5)' }}></div>
    </header>
  )
}