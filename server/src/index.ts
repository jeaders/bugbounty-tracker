import express from 'express'
import cors from 'cors'
import { scrapeAllPlatforms } from './scraper'
import { initDB, getBounties, saveBounties } from './database'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

app.get('/api/bounties', (req, res) => {
  const bounties = getBounties()
  res.json(bounties)
})

app.get('/api/scrape', async (req, res) => {
  const bounties = await scrapeAllPlatforms()
  saveBounties(bounties)
  res.json({ status: 'Scraping completato', count: bounties.length })
})

initDB()

scrapeAllPlatforms().then(saveBounties)

app.listen(PORT, () => {
  console.log(`[CYBERPUNK] Server in ascolto su porta ${PORT}`)
})