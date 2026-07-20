import React, { useState, useEffect } from 'react'
import { Filter, BugBounty, Severita, AssetType } from './types'
import { FilterPanel } from './components/FilterPanel'
import { BountyList } from './components/BountyList'
import { Header } from './components/Header'
import { StatsPanel } from './components/StatsPanel'
import { FavoritesPanel } from './components/FavoritesPanel'
import { BountyModal } from './components/BountyModal'

function App() {
  const [bounties, setBounties] = useState<BugBounty[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedBounty, setSelectedBounty] = useState<BugBounty | null>(null)
  const [filters, setFilters] = useState<Filter>({
    payoutMin: 0,
    payoutMax: 100000,
    severita: [],
    assetType: [],
    programma: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    fetchBounties()
    loadFavorites()
    loadTheme()
  }, [])

  useEffect(() => {
    saveTheme()
  }, [isDarkMode])

  const fetchBounties = async () => {
    const response = await fetch('/api/bounties')
    const data = await response.json()
    setBounties(data)
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem('bounty-favorites')
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }

  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem('bounty-favorites', JSON.stringify(newFavorites))
  }

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      saveFavorites(favorites.filter(f => f !== id))
    } else {
      saveFavorites([...favorites, id])
    }
  }

  const loadTheme = () => {
    const saved = localStorage.getItem('bounty-theme')
    if (saved) {
      setIsDarkMode(saved === 'dark')
    }
  }

  const saveTheme = () => {
    localStorage.setItem('bounty-theme', isDarkMode ? 'dark' : 'light')
  }

  const exportData = () => {
    const dataStr = JSON.stringify(bounties, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bounties-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const exportCSV = () => {
    const headers = ['Titolo', 'Programma', 'Payout', 'Severita', 'Asset', 'URL', 'Data']
    const csvContent = [
      headers.join(','),
      ...bounties.map(b => [
        `"${b.titolo}"`,
        `"${b.programma}"`,
        b.payout,
        b.severita,
        b.assetType,
        `"${b.url}"`,
        b.dataCreazione
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bounties-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<bugbounties>
${bounties.map(b => `  <bounty>
    <titolo>${b.titolo}</titolo>
    <programma>${b.programma}</programma>
    <payout>${b.payout}</payout>
    <severita>${b.severita}</severita>
    <assetType>${b.assetType}</assetType>
    <url>${b.url}</url>
    <descrizione>${b.descrizione}</descrizione>
    <dataCreazione>${b.dataCreazione}</dataCreazione>
  </bounty>`).join('\n')}
</bugbounties>`

    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bounties-${new Date().toISOString().split('T')[0]}.xml`
    a.click()
  }

  const filteredBounties = bounties.filter(bounty => {
    if (bounty.payout < filters.payoutMin || bounty.payout > filters.payoutMax) return false
    if (filters.severita.length > 0 && !filters.severita.includes(bounty.severita)) return false
    if (filters.assetType.length > 0 && !filters.assetType.includes(bounty.assetType)) return false
    if (searchQuery && !bounty.titolo.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !bounty.programma.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !bounty.descrizione.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-black text-cyan-400' : 'bg-gray-100 text-gray-800'}`}>
      {isDarkMode && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-black"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full"></div>
          <div className="cyber-grid absolute inset-0 opacity-30"></div>
        </div>
      )}
      
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Ricerca fulltext bounty..."
            className={`cyber-input w-full sm:w-96 ${isDarkMode ? '' : 'bg-white !text-gray-800 placeholder-gray-500'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="flex gap-2">
            <button onClick={exportCSV} className="cyber-button text-xs px-3 py-1.5">CSV</button>
            <button onClick={exportData} className="cyber-button text-xs px-3 py-1.5">JSON</button>
            <button onClick={exportXML} className="cyber-button text-xs px-3 py-1.5">XML</button>
          </div>
        </div>

        <StatsPanel bounties={filteredBounties} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <FilterPanel filters={filters} setFilters={setFilters} />
            <FavoritesPanel favorites={favorites} bounties={bounties} onToggle={toggleFavorite} />
          </div>
          <div className="lg:col-span-3">
            <BountyList 
              bounties={filteredBounties} 
              filters={{...filters, programma: searchQuery}}
              onSelect={setSelectedBounty}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      </div>

      {selectedBounty && (
        <BountyModal bounty={selectedBounty} onClose={() => setSelectedBounty(null)} />
      )}
    </div>
  )
}

export default App