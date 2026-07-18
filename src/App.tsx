import { useState, useEffect, useCallback, useMemo, lazy, Suspense, memo } from 'react'
import { Filter, BugBounty } from './types'
import { FilterPanel } from './components/FilterPanel'
import { BountyList } from './components/BountyList'
import { Header } from './components/Header'
import { StatsPanel } from './components/StatsPanel'
import { FavoritesPanel } from './components/FavoritesPanel'
import { loadBounties, loadMetadata, BountyMetadata } from './services/bountyLoader'
import { BottomNav, NavSection } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { PullToRefresh } from './components/PullToRefresh'
import { Section } from './components/Section'

// Lazy load del modal per ridurre il bundle iniziale
const BountyModal = lazy(() => import('./components/BountyModal').then(m => ({ default: m.BountyModal })))

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
  const [activeSection, setActiveSection] = useState<NavSection>('bounties')
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBounties = useCallback(async () => {
    const [data, meta] = await Promise.all([loadBounties(), loadMetadata()])
    setBounties(data)
    setMetadata(meta)
  }, [])

  useEffect(() => {
    fetchBounties()
    loadFavorites()
    loadTheme()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveTheme = useCallback(() => {
    localStorage.setItem('bounty-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    saveTheme()
  }, [saveTheme])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const { clearCache } = await import('./services/bountyLoader')
      clearCache()
      await fetchBounties()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchBounties])

  const loadFavorites = useCallback(() => {
    const saved = localStorage.getItem('bounty-favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  const saveFavorites = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem('bounty-favorites', JSON.stringify(newFavorites))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('bounty-favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const loadTheme = useCallback(() => {
    const saved = localStorage.getItem('bounty-theme')
    if (saved) {
      setIsDarkMode(saved === 'dark')
    }
  }, [])

  // Memoize filtered bounties per evitare ricalcolo ad ogni render
  const filteredBounties = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return bounties.filter(bounty => {
      if (bounty.payout < filters.payoutMin || bounty.payout > filters.payoutMax) return false
      if (filters.severita.length > 0 && !filters.severita.includes(bounty.severita)) return false
      if (filters.assetType.length > 0 && !filters.assetType.includes(bounty.assetType)) return false
      if (q && !bounty.titolo.toLowerCase().includes(q) &&
          !bounty.programma.toLowerCase().includes(q) &&
          !bounty.descrizione.toLowerCase().includes(q)) return false
      return true
    })
  }, [bounties, filters, searchQuery])

  // Memoize export functions
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(filteredBounties, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    triggerDownload(blob, `bounties-${new Date().toISOString().split('T')[0]}.json`)
  }, [filteredBounties])

  const exportCSV = useCallback(() => {
    const headers = ['Titolo', 'Programma', 'Payout', 'Severita', 'Asset', 'URL', 'Data']
    const csvContent = [
      headers.join(','),
      ...filteredBounties.map(b => [
        `"${(b.titolo || '').replace(/"/g, '""')}"`,
        `"${(b.programma || '').replace(/"/g, '""')}"`,
        b.payout,
        b.severita,
        b.assetType,
        `"${b.url}"`,
        b.dataCreazione
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    triggerDownload(blob, `bounties-${new Date().toISOString().split('T')[0]}.csv`)
  }, [filteredBounties])

  const exportXML = useCallback(() => {
    const xmlEscape = (s: string) => (s || '').replace(/[<>&"']/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
    }[c] as string))
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<bugbounties>
${filteredBounties.map(b => `  <bounty>
    <titolo>${xmlEscape(b.titolo)}</titolo>
    <programma>${xmlEscape(b.programma)}</programma>
    <payout>${b.payout}</payout>
    <severita>${b.severita}</severita>
    <assetType>${b.assetType}</assetType>
    <url>${xmlEscape(b.url)}</url>
    <descrizione>${xmlEscape(b.descrizione)}</descrizione>
    <dataCreazione>${b.dataCreazione}</dataCreazione>
  </bounty>`).join('\n')}
</bugbounties>`
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    triggerDownload(blob, `bounties-${new Date().toISOString().split('T')[0]}.xml`)
  }, [filteredBounties])

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-black text-cyan-400' : 'bg-gray-100 text-gray-800'}`}>
      {isDarkMode && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-black"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl will-change-transform"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl will-change-transform"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full"></div>
          <div className="cyber-grid absolute inset-0 opacity-30"></div>
        </div>
      )}

      <Sidebar active={activeSection} onChange={setActiveSection} metadata={metadata} />

      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} metadata={metadata} />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 lg:pb-8 lg:pl-64">
          <Section
            id="bounties"
            title="BOUNTY DISPONIBILI"
            icon="🎯"
            description={metadata ? `Database aggiornato al ${new Date(metadata.lastUpdate).toLocaleString('it-IT')}` : 'Caricamento...'}
            isActive={activeSection === 'bounties'}
          >
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
              <input
                type="search"
                placeholder="🔍 Ricerca fulltext bounty..."
                className={`cyber-input w-full sm:w-96 ${isDarkMode ? '' : 'bg-white !text-gray-800 placeholder-gray-500'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cerca bounty"
              />
              <div className="flex gap-2">
                <button onClick={exportCSV} className="cyber-button text-xs px-3 py-1.5">CSV</button>
                <button onClick={exportData} className="cyber-button text-xs px-3 py-1.5">JSON</button>
                <button onClick={exportXML} className="cyber-button text-xs px-3 py-1.5">XML</button>
              </div>
            </div>

            <MemoizedStatsPanel bounties={filteredBounties} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              <aside className="lg:col-span-1 space-y-4">
                <MemoizedFilterPanel filters={filters} setFilters={setFilters} />
                <MemoizedFavoritesPanel favorites={favorites} bounties={bounties} onToggle={toggleFavorite} />
              </aside>
              <div className="lg:col-span-3">
                <MemoizedBountyList
                  bounties={filteredBounties}
                  filters={{ ...filters, programma: searchQuery }}
                  onSelect={setSelectedBounty}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            </div>
          </Section>

          <Section
            id="programs"
            title="CATALOGO PROGRAMMI"
            icon="🗂️"
            description="Sfoglia per piattaforma"
            isActive={activeSection === 'programs'}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(
                bounties.reduce<Record<string, number>>((acc, b) => {
                  acc[b.programma] = (acc[b.programma] || 0) + 1
                  return acc
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .map(([program, count]) => (
                  <div key={program} className="cyber-card cursor-pointer touch-manipulation" onClick={() => setActiveSection('bounties')}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-cyber text-neon-pink text-sm sm:text-base">{program}</h3>
                      <span className="cyber-badge border-cyan-500/50 text-cyan-400">{count}</span>
                    </div>
                    <p className="text-cyan-500 text-xs font-mono">Clicca per filtrare →</p>
                  </div>
                ))}
            </div>
          </Section>

          <Section
            id="recon"
            title="RECON TOOLBOX"
            icon="🔍"
            description="Strumenti integrati per iniziare la caccia"
            isActive={activeSection === 'recon'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[
                { name: 'Subdomain Finder', desc: 'Enumera sottodomini di un dominio target', cmd: 'subfinder -d target.com -silent | httpx -status-code' },
                { name: 'Port Scanner', desc: 'Scansione veloce tutte le porte', cmd: 'nmap -sV -sC -p- --min-rate 1000 target.com' },
                { name: 'URL Discovery', desc: 'Trova endpoint da Wayback Machine', cmd: 'echo target.com | waybackurls | grep -E "\\.(js|json|php|aspx)"' },
                { name: 'Vuln Scan', desc: 'Template-based scanner', cmd: 'nuclei -u https://target.com -t cves/ -t technologies/' },
                { name: 'JS Analysis', desc: 'Estrai API keys da file JS', cmd: 'echo target.com | gau | grep "\\.js$" | xargs -I{} python3 extractjs.py {}' },
                { name: 'Git Dorking', desc: 'Cerca secrets in repo GitHub', cmd: 'gh search code "target.com" --extension json --extension env' }
              ].map((tool, i) => (
                <div key={i} className="cyber-card">
                  <h3 className="font-cyber text-neon-pink text-base mb-1">{tool.name}</h3>
                  <p className="text-cyan-500 text-xs mb-3 font-mono">{tool.desc}</p>
                  <pre className="bg-black/60 border border-cyan-500/20 rounded p-2 text-xs text-neon-green overflow-x-auto whitespace-pre-wrap break-all">
{tool.cmd}
                  </pre>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="academy"
            title="BUG BOUNTY ACADEMY"
            icon="🎓"
            description="Impara dalle basi al livello expert"
            isActive={activeSection === 'academy'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[
                { level: 'Beginner', color: 'green', title: 'Web Fundamentals', desc: 'HTTP, cookies, CORS, same-origin policy', resources: ['PortSwigger Web Security Academy', 'OWASP Top 10', 'Hacker101 CTF'] },
                { level: 'Intermediate', color: 'yellow', title: 'Burp Suite & Tools', desc: 'Proxy, scanner, intruder, repeater', resources: ['Burp Suite Official Docs', 'NaHamSec YouTube', 'InsiderPhD YouTube'] },
                { level: 'Advanced', color: 'orange', title: 'Business Logic Bugs', desc: 'Sconti, ruoli, race conditions, payment bypass', resources: ['HackerOne Hacktivity', 'PortSwigger Business Logic', 'Books: Web Hacking 101'] },
                { level: 'Expert', color: 'red', title: 'Advanced Exploitation', desc: 'SSRF, deserialization, prototype pollution', resources: ['Project Zero blog', 'Google BugHunter University', 'LiveOverflow YouTube'] }
              ].map((track, i) => (
                <div key={i} className="cyber-card">
                  <span className={`cyber-badge border-${track.color}-500/50 text-${track.color}-400 mb-2 inline-block`}>
                    {track.level.toUpperCase()}
                  </span>
                  <h3 className="font-cyber text-neon-pink text-base mb-1">{track.title}</h3>
                  <p className="text-cyan-500 text-xs mb-3 font-mono">{track.desc}</p>
                  <ul className="space-y-1">
                    {track.resources.map((r, idx) => (
                      <li key={idx} className="text-cyan-300 text-xs flex items-start gap-2">
                        <span className="text-neon-green mt-0.5">▸</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="dashboard"
            title="IL MIO PROFILO HUNTER"
            icon="👤"
            description="Traccia i tuoi progressi (locale, niente server)"
            isActive={activeSection === 'dashboard'}
          >
            <HunterDashboard
              favoritesCount={favorites.length}
              totalBounties={bounties.length}
              onClearFavorites={() => {
                if (confirm('Sicuro di voler cancellare tutti i preferiti?')) {
                  saveFavorites([])
                }
              }}
            />
          </Section>
        </main>
      </PullToRefresh>

      <BottomNav active={activeSection} onChange={setActiveSection} />

      {selectedBounty && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-cyan-400 font-cyber animate-pulse">CARICAMENTO MISSIONE...</div>
          </div>
        }>
          <BountyModal bounty={selectedBounty} onClose={() => setSelectedBounty(null)} />
        </Suspense>
      )}

      {isRefreshing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-cyan-500/20 border border-cyan-500 px-4 py-2 rounded-lg backdrop-blur-md">
          <span className="text-cyan-400 font-cyber text-sm animate-pulse">⟳ AGGIORNAMENTO DB...</span>
        </div>
      )}
    </div>
  )
}

// Componente dashboard hunter (statistiche locali)
const HunterDashboard = memo(({ favoritesCount, totalBounties, onClearFavorites }: {
  favoritesCount: number
  totalBounties: number
  onClearFavorites: () => void
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cyber-card text-center">
          <div className="text-2xl sm:text-3xl font-cyber text-neon-green">{totalBounties}</div>
          <div className="text-cyan-600 text-xs mt-1 font-mono">Bounty nel DB</div>
        </div>
        <div className="cyber-card text-center">
          <div className="text-2xl sm:text-3xl font-cyber text-neon-pink">{favoritesCount}</div>
          <div className="text-cyan-600 text-xs mt-1 font-mono">Preferiti salvati</div>
        </div>
        <div className="cyber-card text-center">
          <div className="text-2xl sm:text-3xl font-cyber text-neon-blue">∞</div>
          <div className="text-cyan-600 text-xs mt-1 font-mono">Report inviati</div>
        </div>
        <div className="cyber-card text-center">
          <div className="text-2xl sm:text-3xl font-cyber text-yellow-400">$0</div>
          <div className="text-cyan-600 text-xs mt-1 font-mono">Guadagno totale</div>
        </div>
      </div>

      <div className="cyber-card">
        <h3 className="font-cyber text-neon-pink mb-2">💾 I tuoi dati sono privati</h3>
        <p className="text-cyan-500 text-sm font-mono">
          Tutto è salvato localmente sul tuo device. Nessun server tiene traccia dei tuoi preferiti o progressi.
        </p>
      </div>

      <div className="cyber-card">
        <h3 className="font-cyber text-neon-pink mb-2">🎯 Prossimi passi suggeriti</h3>
        <ol className="space-y-2 text-sm text-cyan-300">
          <li>1. Vai alla sezione <strong className="text-neon-pink">ACADEMY</strong> e parti dalle basi se sei principiante</li>
          <li>2. Esplora <strong className="text-neon-pink">PROGRAMMI</strong> e scegline 1-2 dove iniziare</li>
          <li>3. Usa la sezione <strong className="text-neon-pink">RECON</strong> per i tuoi primi test</li>
          <li>4. Salva i bounty che ti interessano tra i preferiti ★</li>
          <li>5. Clicca su un bounty per leggere la <strong className="text-neon-pink">MISSIONE</strong> completa</li>
        </ol>
      </div>

      {favoritesCount > 0 && (
        <button
          onClick={onClearFavorites}
          className="cyber-button w-full text-red-400 border-red-500/50"
        >
          🗑️ Cancella tutti i preferiti
        </button>
      )}
    </div>
  )
})
HunterDashboard.displayName = 'HunterDashboard'

// Helper per il download
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Memoized child components per evitare re-render inutili
const MemoizedStatsPanel = memo(StatsPanel)
const MemoizedFilterPanel = memo(FilterPanel)
const MemoizedFavoritesPanel = memo(FavoritesPanel)
const MemoizedBountyList = memo(BountyList)

export default App
