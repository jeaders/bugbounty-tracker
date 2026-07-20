import { scrapeAllPlatforms } from '../src/scraper'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', '..', 'data', 'bounties.json')

async function main() {
  try {
    console.log('[SCRAPE] Starting scrape...')
    const bounties = await scrapeAllPlatforms()

    const dataDir = dirname(OUTPUT_PATH)
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    writeFileSync(OUTPUT_PATH, JSON.stringify(bounties, null, 2))
    console.log(`[SCRAPE] Saved ${bounties.length} bounties to ${OUTPUT_PATH}`)
  } catch (error) {
    console.error('[SCRAPE] Error:', error)
    process.exit(1)
  }
}

main()
