import React from 'react'

interface Props {
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
}

export const Header = ({ isDarkMode, setIsDarkMode }: Props) => {
  return (
    <header className="relative py-8 sm:py-12 border-b-2 border-cyan-500/60 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/15 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cyber text-center bg-gradient-to-r from-neon-pink via-cyan-400 to-neon-green bg-clip-text text-transparent glow-text tracking-widest">
            BUG BOUNTY TRACKER
          </h1>
          <div className="flex items-center gap-3 mt-4 px-4 py-1.5 bg-black/50 rounded-full border border-cyan-500/30">
            <span className="w-3 h-3 bg-neon-green rounded-full animate-pulse shadow-lg shadow-neon-green"></span>
            <span className="text-cyan-400 font-mono text-sm">LIVE MONITORING ACTIVE</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-500"></div>
    </header>
  )
}