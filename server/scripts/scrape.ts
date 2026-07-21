/**
 * Script standalone per scraping bug bounty
 * Usato da:
 *  - GitHub Actions (schedulato giornaliero)
 *  - Comando locale `npm run scrape`
 *
 * Output: scrive server/data/bounties.json
 */

import { scrapeAllPlatforms } from '../src/scraper'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const OUTPUT_PATH = join(__dirname, '..', 'data', 'bounties.json')

const main = async () => {
  const startTime = Date.now()
  console.log('[SCRAPER] Avvio scraping completo...')

  try {
    const bounties = await scrapeAllPlatforms()
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Statistiche
    const byProgram = bounties.reduce<Record<string, number>>((acc, b) => {
      acc[b.programma] = (acc[b.programma] || 0) + 1
      return acc
    }, {})
    const bySeverity = bounties.reduce<Record<string, number>>((acc, b) => {
      acc[b.severita] = (acc[b.severita] || 0) + 1
      return acc
    }, {})
    const totalPayout = bounties.reduce((sum, b) => sum + b.payout, 0)

    console.log(`[SCRAPER] Completato in ${duration}s`)
    console.log(`[SCRAPER] Trovati ${bounties.length} bounty`)
    console.log(`[SCRAPER] Payout totale cumulato: $${totalPayout.toLocaleString()}`)
    console.log('[SCRAPER] Distribuzione per piattaforma:')
    Object.entries(byProgram)
      .sort(([, a], [, b]) => b - a)
      .forEach(([program, count]) => console.log(`  - ${program}: ${count}`))
    console.log('[SCRAPER] Distribuzione per severità:')
    Object.entries(bySeverity)
      .sort(([, a], [, b]) => b - a)
      .forEach(([sev, count]) => console.log(`  - ${sev}: ${count}`))

    // Scrivi il file JSON
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
    writeFileSync(OUTPUT_PATH, JSON.stringify(bounties, null, 2), 'utf-8')
    console.log(`[SCRAPER] File salvato in: ${OUTPUT_PATH}`)

    // Scrivi anche un metadata file per statistiche
    const metadata = {
      lastUpdate: new Date().toISOString(),
      totalBounties: bounties.length,
      totalPayout,
      byProgram,
      bySeverity,
      scrapeDurationMs: Date.now() - startTime
    }
    const metaPath = join(__dirname, '..', 'data', 'metadata.json')
    writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8')
    console.log(`[SCRAPER] Metadata salvato in: ${metaPath}`)

    process.exit(0)
  } catch (error) {
    console.error('[SCRAPER] ERRORE:', error)
    process.exit(1)
  }
}

main()
