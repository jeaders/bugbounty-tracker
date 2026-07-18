import { BugBounty } from '../types'

const BOUNTIES_URL = '/bounties.json'
const META_URL = '/bounties-meta.json'

export interface BountyMetadata {
  lastUpdate: string
  totalBounties: number
  totalPayout: number
  byProgram: Record<string, number>
  bySeverity: Record<string, number>
  scrapeDurationMs: number
}

// Cache in-memory per evitare fetch ripetuti
let cache: { data: BugBounty[]; timestamp: number } | null = null
let metaCache: BountyMetadata | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minuti

export const loadBounties = async (): Promise<BugBounty[]> => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  try {
    const response = await fetch(BOUNTIES_URL, { cache: 'force-cache' })
    if (!response.ok) {
      throw new Error(`Failed to load bounties: ${response.status}`)
    }
    const data: BugBounty[] = await response.json()
    cache = { data, timestamp: Date.now() }
    return data
  } catch (error) {
    console.error('[LOADER] Errore caricamento bounties:', error)
    // Fallback: prova a leggere dai sample locali
    return []
  }
}

export const loadMetadata = async (): Promise<BountyMetadata | null> => {
  if (metaCache) return metaCache
  try {
    const response = await fetch(META_URL, { cache: 'force-cache' })
    if (!response.ok) return null
    metaCache = await response.json()
    return metaCache
  } catch {
    return null
  }
}

export const clearCache = () => {
  cache = null
  metaCache = null
}
