import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const BOUNTIES_PATH = join(process.cwd(), 'bounties.json')
const PUBLIC_DIR = join(process.cwd(), 'public')
const PUBLIC_BOUNTIES_PATH = join(PUBLIC_DIR, 'bounties.json')
const PUBLIC_META_PATH = join(PUBLIC_DIR, 'bounties-meta.json')

try {
  // Ensure public directory exists
  mkdirSync(PUBLIC_DIR, { recursive: true })

  // Check if bounties.json exists in root
  let bounties = []
  let bountiesPath = BOUNTIES_PATH
  
  try {
    const data = readFileSync(BOUNTIES_PATH, 'utf-8')
    bounties = JSON.parse(data)
    console.log(`[BUILD] Found ${bounties.length} bounties in root bounties.json`)
  } catch {
    // Try server/data
    try {
      const data = readFileSync(join(process.cwd(), 'server', 'data', 'bounties.json'), 'utf-8')
      bounties = JSON.parse(data)
      bountiesPath = join(process.cwd(), 'server', 'data', 'bounties.json')
      console.log(`[BUILD] Found ${bounties.length} bounties in server/data/bounties.json`)
    } catch (e) {
      console.error('[BUILD] No bounties.json found')
      process.exit(1)
    }
  }

  // Copy bounties.json to public
  writeFileSync(PUBLIC_BOUNTIES_PATH, readFileSync(bountiesPath), 'utf-8')
  console.log(`[BUILD] Copied bounties.json to public/`)

  // Generate metadata
  const byProgram = bounties.reduce((acc, b) => {
    acc[b.programma] = (acc[b.programma] || 0) + 1
    return acc
  }, {})
  const bySeverity = bounties.reduce((acc, b) => {
    acc[b.severita] = (acc[b.severita] || 0) + 1
    return acc
  }, {})
  const totalPayout = bounties.reduce((sum, b) => sum + (b.payout || 0), 0)

  const metadata = {
    lastUpdate: new Date().toISOString(),
    totalBounties: bounties.length,
    totalPayout,
    byProgram,
    bySeverity,
    scrapeDurationMs: 0
  }

  writeFileSync(PUBLIC_META_PATH, JSON.stringify(metadata, null, 2), 'utf-8')
  console.log(`[BUILD] Generated bounties-meta.json in public/`)
} catch (error) {
  console.error('[BUILD] Error generating metadata:', error.message)
  process.exit(1)
}