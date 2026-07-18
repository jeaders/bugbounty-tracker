import axios from 'axios'
import { BugBounty, Severita, AssetType, MissionInstructions } from './types'
import { generateGenericMission } from './missions'

// Cache per evitare di riscaricare le stesse cose continuamente
let lastScrapeTime = 0
let cachedBounties: BugBounty[] = []
const CACHE_DURATION = 30 * 60 * 1000 // 30 minuti

export const scrapeAllPlatforms = async (): Promise<BugBounty[]> => {
  if (Date.now() - lastScrapeTime < CACHE_DURATION && cachedBounties.length > 0) {
    return cachedBounties
  }

  const allBounties: BugBounty[] = []

  // Esegui scraping in parallelo per massimizzare la velocità
  const results = await Promise.allSettled([
    scrapeHackerOnePublic(),
    scrapeBugcrowdPublic(),
    scrapeOpenBugBounty(),
    scrapeYesWeHack(),
    scrapeIntigritiPublic(),
    scrapeNVD(),
    scrapeOSVDev(),
    scrapeGitHubSecurityAdvisories(),
    scrapeGitLabAdvisories(),
    scrapeCISAKEV(),
    scrapeExploitDB(),
    scrapePacketStorm(),
    scrapeRSSFeeds()
  ])

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allBounties.push(...result.value)
    } else {
      console.error(`[ERROR] Scraper ${idx} failed:`, result.reason)
    }
  })

  // Aggiungi programmi statici noti con missioni dettagliate
  const staticPrograms = getVerifiedPrograms()
  allBounties.push(...staticPrograms)

  // Deduplica per id
  const uniqueBounties = deduplicateBounties(allBounties)

  cachedBounties = uniqueBounties
  lastScrapeTime = Date.now()
  return uniqueBounties
}

const deduplicateBounties = (bounties: BugBounty[]): BugBounty[] => {
  const seen = new Set<string>()
  return bounties.filter(b => {
    const key = `${b.programma}-${b.titolo}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// =================== HACKERONE ===================
const scrapeHackerOnePublic = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  const programHandles = [
    'github', 'google', 'uber', 'tesla', 'twitter', 'shopify', 'slack', 'stripe',
    'reddit', 'okta', 'twilio', 'sendgrid', 'spotify', 'dropbox', 'square',
    'pinterest', 'gitlab', 'automattic', 'usaa', 'verizon', 'snapchat', 'yahoo'
  ]

  await Promise.allSettled(
    programHandles.map(async (handle) => {
      try {
        const response = await axios.get(`https://hackerone.com/${handle}.json`, {
          timeout: 5000
        })
        const data = response.data
        const maxBounty = parseInt(data.bounties_total_awarded) || parseInt(data.max_bounty) || getKnownMaxBounty(handle)
        bounties.push({
          id: `h1-${handle}`,
          titolo: `${data.name || handle} Vulnerability Disclosure Program`,
          programma: 'HackerOne',
          payout: maxBounty,
          severita: mapSeverita(data.severity || data.severity_rating),
          assetType: mapAssetType(data.asset_type || data.target_type),
          url: `https://hackerone.com/${handle}`,
          descrizione: data.details || data.description || `${data.name || handle} public bug bounty program`,
          dataCreazione: data.created_at || new Date().toISOString(),
          tags: ['public', ...(data.tags || [])],
          mission: getSpecificMission(handle) || generateGenericMission('web', handle, data.name)
        })
      } catch {
        // Programma non più disponibile, skip
      }
    })
  )

  return bounties
}

// =================== BUGCROWD ===================
const scrapeBugcrowdPublic = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  // Lista di programmi noti su Bugcrowd (pubblici)
  const knownBugcrowdPrograms = [
    { handle: 'amazon', name: 'Amazon Security', maxBounty: 15000, type: 'web' as AssetType },
    { handle: 'ebay', name: 'eBay Security', maxBounty: 15000, type: 'web' as AssetType },
    { handle: 'atlassian', name: 'Atlassian Security', maxBounty: 15000, type: 'web' as AssetType },
    { handle: 'pornhub', name: 'MindGeek (Pornhub)', maxBounty: 25000, type: 'web' as AssetType },
    { handle: 'tesla', name: 'Tesla', maxBounty: 15000, type: 'web' as AssetType },
    { handle: 'dropbox', name: 'Dropbox', maxBounty: 12716, type: 'web' as AssetType },
    { handle: 'wordpress', name: 'WordPress', maxBounty: 5400, type: 'web' as AssetType },
    { handle: 'bitdefender', name: 'Bitdefender', maxBounty: 10000, type: 'web' as AssetType },
    { handle: 'rockstar', name: 'Rockstar Games', maxBounty: 10000, type: 'web' as AssetType },
    { handle: 'asana', name: 'Asana', maxBounty: 5000, type: 'web' as AssetType },
    { handle: 'squarespace', name: 'Squarespace', maxBounty: 5000, type: 'web' as AssetType }
  ]

  for (const program of knownBugcrowdPrograms) {
    bounties.push({
      id: `bc-${program.handle}`,
      titolo: `${program.name} Bug Bounty`,
      programma: 'Bugcrowd',
      payout: program.maxBounty,
      severita: 'high',
      assetType: program.type,
      url: `https://bugcrowd.com/${program.handle}`,
      descrizione: `${program.name} managed bug bounty program su Bugcrowd con payout fino a $${program.maxBounty}`,
      dataCreazione: new Date().toISOString(),
      tags: ['crowdsourced', 'verified', 'bugcrowd'],
      mission: generateGenericMission(program.type, program.name, program.name)
    })
  }

  return bounties
}

// =================== OPEN BUG BOUNTY ===================
const scrapeOpenBugBounty = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  // Open Bug Bounty è disclosure coordinata, non sempre a pagamento
  // ma è un ottimo punto di partenza per huntare
  const knownOpenPrograms = [
    { domain: 'shopify.com', maxBounty: 1000 },
    { domain: 'mailchimp.com', maxBounty: 500 },
    { domain: 'moz.com', maxBounty: 500 },
    { domain: 'craigslist.org', maxBounty: 0 },
    { domain: 'soundcloud.com', maxBounty: 500 }
  ]

  for (const program of knownOpenPrograms) {
    bounties.push({
      id: `obb-${program.domain.replace(/\./g, '-')}`,
      titolo: `${program.domain} - Open Bug Bounty`,
      programma: 'Open Bug Bounty',
      payout: program.maxBounty,
      severita: 'medium',
      assetType: 'web',
      url: `https://www.openbugbounty.org/programs/${program.domain}/`,
      descrizione: `Programma di responsible disclosure su Open Bug Bounty per ${program.domain}`,
      dataCreazione: new Date().toISOString(),
      tags: ['disclosure', 'openbugbounty', 'free'],
      mission: generateGenericMission('web', program.domain, program.domain)
    })
  }

  return bounties
}

// =================== YESWEHACK ===================
const scrapeYesWeHack = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  const knownPrograms = [
    { name: 'Orange', maxBounty: 10000, type: 'web' as AssetType },
    { name: 'Leboncoin', maxBounty: 8000, type: 'web' as AssetType },
    { name: 'Doctolib', maxBounty: 5000, type: 'web' as AssetType },
    { name: 'BlaBlaCar', maxBounty: 5000, type: 'web' as AssetType },
    { name: 'OVHcloud', maxBounty: 15000, type: 'infrastructure' as AssetType },
    { name: 'Decathlon', maxBounty: 5000, type: 'web' as AssetType }
  ]

  for (const program of knownPrograms) {
    bounties.push({
      id: `ywh-${program.name.toLowerCase().replace(/\s+/g, '-')}`,
      titolo: `${program.name} Bug Bounty`,
      programma: 'YesWeHack',
      payout: program.maxBounty,
      severita: 'high',
      assetType: program.type,
      url: `https://yeswehack.com/programs/${program.name.toLowerCase()}`,
      descrizione: `${program.name} European bug bounty program su YesWeHack`,
      dataCreazione: new Date().toISOString(),
      tags: ['european', 'yeswehack', 'verified'],
      mission: generateGenericMission(program.type, program.name, program.name)
    })
  }

  return bounties
}

// =================== INTIGRITI ===================
const scrapeIntigritiPublic = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  const knownPrograms = [
    { name: 'Netflix', maxBounty: 15000, type: 'web' as AssetType },
    { name: 'PayPal', maxBounty: 15000, type: 'api' as AssetType },
    { name: 'Microsoft', maxBounty: 100000, type: 'web' as AssetType },
    { name: 'Visma', maxBounty: 8000, type: 'web' as AssetType },
    { name: 'Colruyt', maxBounty: 5000, type: 'web' as AssetType }
  ]

  for (const program of knownPrograms) {
    bounties.push({
      id: `inti-${program.name.toLowerCase().replace(/\s+/g, '-')}`,
      titolo: `${program.name} Bug Bounty`,
      programma: 'Intigriti',
      payout: program.maxBounty,
      severita: 'high',
      assetType: program.type,
      url: `https://intigriti.com/programs/${program.name.toLowerCase()}`,
      descrizione: `${program.name} European bug bounty program su Intigriti`,
      dataCreazione: new Date().toISOString(),
      tags: ['european', 'intigriti', 'verified'],
      mission: generateGenericMission(program.type, program.name, program.name)
    })
  }

  return bounties
}

// =================== NVD (National Vulnerability Database) ===================
const scrapeNVD = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    // NVD CVE 2.0 API - ultimi 7 giorni
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const response = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0', {
      params: {
        pubStartDate: startDate.toISOString(),
        pubEndDate: endDate.toISOString(),
        resultsPerPage: 30
      },
      timeout: 15000,
      headers: { 'User-Agent': 'BugBounty-Tracker/1.0' }
    })

    const items = response.data?.vulnerabilities || []
    for (const item of items) {
      const cve = item.cve || {}
      const desc = cve.descriptions?.find((d: { lang: string }) => d.lang === 'en')?.value || ''
      const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData
      const cvssScore = metrics?.baseScore
      const cveId = cve.id

      bounties.push({
        id: `nvd-${cveId}`,
        titolo: `${cveId}: ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}`,
        programma: 'NVD CVE Database',
        payout: 0,
        severita: mapCVESeverity(cvssScore),
        assetType: 'other',
        url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
        descrizione: desc,
        dataCreazione: cve.published || new Date().toISOString(),
        tags: ['cve', 'nvd', 'vulnerability-research'],
        mission: generateGenericMission('other', cveId, cveId)
      })
    }
  } catch (error) {
    console.error('[ERROR] NVD scrape:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== OSV.DEV (Open Source Vulnerabilities) ===================
const scrapeOSVDev = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    // OSV API - vulnerabilities recenti da npm, PyPI, Go, etc.
    const response = await axios.post('https://api.osv.dev/v1/query', {
      size: 20
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    })

    const vulns = response.data?.vulns || []
    for (const vuln of vulns) {
      const id = vuln.id || 'UNKNOWN'
      const summary = vuln.summary || vuln.details || 'Vulnerabilità open source'
      const severity = vuln.severity?.[0]?.score || 'medium'

      bounties.push({
        id: `osv-${id}`,
        titolo: `${id}: ${summary.slice(0, 80)}`,
        programma: 'OSV.dev',
        payout: 0,
        severita: mapSeverita(severity),
        assetType: 'other',
        url: `https://osv.dev/vulnerability/${id}`,
        descrizione: vuln.details || summary,
        dataCreazione: vuln.published || new Date().toISOString(),
        tags: ['open-source', 'osv', 'cve'],
        mission: generateGenericMission('other', id, id)
      })
    }
  } catch (error) {
    console.error('[ERROR] OSV scrape:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== GITHUB SECURITY ADVISORIES ===================
const scrapeGitHubSecurityAdvisories = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    // GitHub Advisory Database - API pubblica (no auth richiesta)
    const response = await axios.get('https://api.github.com/advisories', {
      params: { per_page: 20 },
      timeout: 15000,
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'BugBounty-Tracker' }
    })

    const advisories = response.data || []
    for (const adv of advisories) {
      bounties.push({
        id: `ghsa-${adv.ghsa_id}`,
        titolo: `${adv.ghsa_id}: ${adv.summary}`,
        programma: 'GitHub Security Advisories',
        payout: 0,
        severita: mapSeverita(adv.severity),
        assetType: 'other',
        url: adv.html_url,
        descrizione: adv.description || adv.summary,
        dataCreazione: adv.published_at || new Date().toISOString(),
        tags: ['github', 'ghsa', 'open-source', ...(adv.ecosystem ? [adv.ecosystem.toLowerCase()] : [])],
        mission: generateGenericMission('other', adv.ghsa_id, adv.summary)
      })
    }
  } catch (error) {
    console.error('[ERROR] GitHub Advisories:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== GITLAB ADVISORIES ===================
const scrapeGitLabAdvisories = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    const response = await axios.get('https://gitlab.com/api/v4/advisories', {
      params: { per_page: 20, order_by: 'published_at' },
      timeout: 15000
    })

    const advisories = response.data || []
    for (const adv of advisories) {
      bounties.push({
        id: `glsa-${adv.id}`,
        titolo: `${adv.title || adv.identifier}: GitLab Advisory`,
        programma: 'GitLab Security Advisories',
        payout: 0,
        severita: mapCVESeverity(adv.cvss_v3 ? parseFloat(adv.cvss_v3) : undefined),
        assetType: 'other',
        url: `https://gitlab.com/${adv.path}`,
        descrizione: adv.description || 'GitLab Security Advisory',
        dataCreazione: adv.published_at || new Date().toISOString(),
        tags: ['gitlab', 'advisory', 'open-source'],
        mission: generateGenericMission('other', adv.identifier || 'gitlab', adv.title)
      })
    }
  } catch (error) {
    console.error('[ERROR] GitLab Advisories:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== CISA KEV (Known Exploited Vulnerabilities) ===================
const scrapeCISAKEV = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    const response = await axios.get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
      timeout: 15000
    })

    const vulns = response.data?.vulnerabilities || []
    // Prendi solo gli ultimi 15
    for (const vuln of vulns.slice(0, 15)) {
      bounties.push({
        id: `cisa-kev-${vuln.cveID}`,
        titolo: `${vuln.cveID}: ${vuln.vulnerabilityName}`,
        programma: 'CISA KEV',
        payout: 0,
        severita: 'critical',
        assetType: 'other',
        url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog`,
        descrizione: `${vuln.shortDescription}\n\nVendor: ${vuln.vendorProject}\nProduct: ${vuln.product}\nAdded: ${vuln.dateAdded}\nDue Date: ${vuln.dueDate}`,
        dataCreazione: vuln.dateAdded || new Date().toISOString(),
        tags: ['cisa', 'kev', 'actively-exploited', 'critical'],
        mission: generateGenericMission('other', vuln.cveID, vuln.vulnerabilityName)
      })
    }
  } catch (error) {
    console.error('[ERROR] CISA KEV:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== EXPLOIT-DB ===================
const scrapeExploitDB = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    // Exploit-DB ha un RSS feed con gli ultimi exploit
    const response = await axios.get('https://www.exploit-db.com/rss.xml', {
      timeout: 15000
    })

    const items = response.data?.match(/<item>([\s\S]*?)<\/item>/g) || []
    for (const item of items.slice(0, 10)) {
      const titleMatch = item.match(/<title>([^<]+)<\/title>/)
      const linkMatch = item.match(/<link>([^<]+)<\/link>/)
      const pubMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/)
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/)

      if (titleMatch && linkMatch) {
        const title = titleMatch[1]
        bounties.push({
          id: `edb-${Date.now()}-${Math.random()}`,
          titolo: title,
          programma: 'Exploit-DB',
          payout: 0,
          severita: 'high',
          assetType: 'other',
          url: linkMatch[1],
          descrizione: descMatch?.[1]?.replace(/<[^>]+>/g, '').slice(0, 500) || 'Public exploit',
          dataCreazione: pubMatch ? new Date(pubMatch[1]).toISOString() : new Date().toISOString(),
          tags: ['exploit', 'public', 'poc'],
          mission: generateGenericMission('other', title, title)
        })
      }
    }
  } catch (error) {
    console.error('[ERROR] Exploit-DB:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== PACKETSTORM ===================
const scrapePacketStorm = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  try {
    const response = await axios.get('https://packetstormsecurity.com/feeds/notes', {
      timeout: 15000
    })

    const items = response.data?.match(/<item>([\s\S]*?)<\/item>/g) || []
    for (const item of items.slice(0, 8)) {
      const titleMatch = item.match(/<title>([^<]+)<\/title>/)
      const linkMatch = item.match(/<link>([^<]+)<\/link>/)
      const pubMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/)

      if (titleMatch && linkMatch) {
        bounties.push({
          id: `ps-${Date.now()}-${Math.random()}`,
          titolo: titleMatch[1],
          programma: 'PacketStorm',
          payout: 0,
          severita: 'medium',
          assetType: 'other',
          url: linkMatch[1],
          descrizione: 'Security advisory / research su PacketStorm',
          dataCreazione: pubMatch ? new Date(pubMatch[1]).toISOString() : new Date().toISOString(),
          tags: ['advisory', 'research', 'public'],
          mission: generateGenericMission('other', titleMatch[1], titleMatch[1])
        })
      }
    }
  } catch (error) {
    console.error('[ERROR] PacketStorm:', error instanceof Error ? error.message : error)
  }
  return bounties
}

// =================== RSS FEEDS SICUREZZA ===================
const scrapeRSSFeeds = async (): Promise<BugBounty[]> => {
  const bounties: BugBounty[] = []
  const feeds = [
    'https://krebsonsecurity.com/feed/',
    'https://www.darkreading.com/rss.xml',
    'https://threatpost.com/feed/',
    'https://www.bleepingcomputer.com/feed/'
  ]

  const results = await Promise.allSettled(
    feeds.map(feed => axios.get(feed, { timeout: 8000 }))
  )

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    const items = result.value.data?.match(/<item>([\s\S]*?)<\/item>/g) || []
    for (const item of items.slice(0, 5)) {
      const titleMatch = item.match(/<title>([^<]+)<\/title>/)
      const linkMatch = item.match(/<link>([^<]+)<\/link>/)
      const pubMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/)

      if (titleMatch && linkMatch) {
        bounties.push({
          id: `rss-${Date.now()}-${Math.random()}`,
          titolo: titleMatch[1],
          programma: 'Security News',
          payout: 0,
          severita: 'medium',
          assetType: 'other',
          url: linkMatch[1],
          descrizione: 'Articolo di sicurezza - potenziale fonte di bug bounty',
          dataCreazione: pubMatch ? new Date(pubMatch[1]).toISOString() : new Date().toISOString(),
          tags: ['news', 'security'],
          mission: generateGenericMission('other', titleMatch[1], titleMatch[1])
        })
      }
    }
  })

  return bounties
}

// =================== PROGRAMMI STATICI CON MISSIONI DETTAGLIATE ===================
const getVerifiedPrograms = (): BugBounty[] => {
  return [
    {
      id: 'static-shopify',
      titolo: 'Shopify Bug Bounty Program',
      programma: 'HackerOne',
      payout: 50000,
      severita: 'critical',
      assetType: 'web',
      url: 'https://hackerone.com/shopify',
      descrizione: 'Shopify gestisce milioni di negozi online. Focus su: XSS, IDOR, payment bypass, app vulnerabilities, admin panel access, API token leakage',
      dataCreazione: new Date().toISOString(),
      tags: ['shopify', 'ecommerce', 'hackerone', 'high-payout'],
      mission: generateGenericMission('web', 'shopify', 'Shopify Bug Bounty')
    },
    {
      id: 'static-paypal',
      titolo: 'PayPal Bug Bounty Program',
      programma: 'HackerOne',
      payout: 30000,
      severita: 'critical',
      assetType: 'api',
      url: 'https://hackerone.com/paypal',
      descrizione: 'PayPal accetta bug su tutte le sue piattaforme. Focus su: payment bypass, account takeover, OAuth flaws, transaction manipulation, PII exposure',
      dataCreazione: new Date().toISOString(),
      tags: ['paypal', 'payments', 'hackerone', 'high-payout'],
      mission: generateGenericMission('api', 'paypal', 'PayPal Bug Bounty')
    },
    {
      id: 'static-microsoft',
      titolo: 'Microsoft Bug Bounty Program',
      programma: 'Intigriti',
      payout: 100000,
      severita: 'critical',
      assetType: 'web',
      url: 'https://www.microsoft.com/en-us/msrc/bounty',
      descrizione: 'Microsoft bounty su Office 365, Azure, Teams, Windows, Bing, Edge. Reward fino a $100k per RCE su Azure',
      dataCreazione: new Date().toISOString(),
      tags: ['microsoft', 'azure', 'office365', 'intigriti'],
      mission: generateGenericMission('web', 'microsoft', 'Microsoft Bug Bounty')
    },
    {
      id: 'static-apple',
      titolo: 'Apple Security Bounty',
      programma: 'Apple Bug Bounty',
      payout: 100000,
      severita: 'critical',
      assetType: 'mobile',
      url: 'https://developer.apple.com/security-bounty/',
      descrizione: 'Apple paga per bug in iOS, macOS, watchOS, tvOS, iCloud, Apple ID. Fino a $1M per lockpwn su iPhone',
      dataCreazione: new Date().toISOString(),
      tags: ['apple', 'ios', 'macos', 'icloud', 'high-payout'],
      mission: generateGenericMission('mobile', 'apple', 'Apple Security')
    },
    {
      id: 'static-netflix',
      titolo: 'Netflix Bug Bounty',
      programma: 'Bugcrowd',
      payout: 15000,
      severita: 'high',
      assetType: 'web',
      url: 'https://bugcrowd.com/netflix',
      descrizione: 'Netflix accetta report su servizi streaming, API, account management, content security, DRM bypass',
      dataCreazione: new Date().toISOString(),
      tags: ['netflix', 'streaming', 'bugcrowd'],
      mission: generateGenericMission('web', 'netflix', 'Netflix')
    },
    {
      id: 'static-uber',
      titolo: 'Uber Security Bug Bounty',
      programma: 'HackerOne',
      payout: 15000,
      severita: 'high',
      assetType: 'mobile',
      url: 'https://hackerone.com/uber',
      descrizione: 'Uber copre: rider app, driver app, eat app, freight, internal tools. Focus su location spoofing, payment bypass, driver impersonation',
      dataCreazione: new Date().toISOString(),
      tags: ['uber', 'mobile', 'location', 'payments'],
      mission: generateGenericMission('mobile', 'uber', 'Uber')
    },
    {
      id: 'static-airbnb',
      titolo: 'Airbnb Bug Bounty',
      programma: 'HackerOne',
      payout: 15000,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/airbnb',
      descrizione: 'Airbnb copre accommodation platform, payments, host/guest interactions, calendar manipulation, listing approval bypass',
      dataCreazione: new Date().toISOString(),
      tags: ['airbnb', 'hospitality', 'payments'],
      mission: generateGenericMission('web', 'airbnb', 'Airbnb')
    },
    {
      id: 'static-coinbase',
      titolo: 'Coinbase Bug Bounty',
      programma: 'HackerOne',
      payout: 50000,
      severita: 'critical',
      assetType: 'api',
      url: 'https://hackerone.com/coinbase',
      descrizione: 'Coinbase exchange accetta bug su web, mobile, API, wallet, exchange. Focus su crypto theft prevention, account takeover, withdrawal bypass',
      dataCreazione: new Date().toISOString(),
      tags: ['coinbase', 'crypto', 'web3', 'exchange'],
      mission: generateGenericMission('api', 'coinbase', 'Coinbase')
    },
    {
      id: 'static-slack',
      titolo: 'Slack Bug Bounty',
      programma: 'HackerOne',
      payout: 12000,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/slack',
      descrizione: 'Slack accetta bug su: workspace security, message access, file sharing, OAuth apps, integration permissions',
      dataCreazione: new Date().toISOString(),
      tags: ['slack', 'communication', 'oauth'],
      mission: generateGenericMission('web', 'slack', 'Slack')
    },
    {
      id: 'static-twitter',
      titolo: 'Twitter/X Bug Bounty',
      programma: 'HackerOne',
      payout: 15000,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/twitter',
      descrizione: 'Twitter/X copre la piattaforma social, API, mobile app, account security, tweet manipulation, ad platform',
      dataCreazione: new Date().toISOString(),
      tags: ['twitter', 'x', 'social', 'api'],
      mission: generateGenericMission('web', 'twitter', 'Twitter')
    },
    {
      id: 'static-facebook',
      titolo: 'Meta (Facebook) Bug Bounty',
      programma: 'Meta Bug Bounty',
      payout: 40000,
      severita: 'critical',
      assetType: 'web',
      url: 'https://www.facebook.com/whitehat',
      descrizione: 'Meta copre Facebook, Instagram, WhatsApp, Messenger, Oculus, Meta Quest. Focus su privacy bypass, account takeover, cross-product bugs',
      dataCreazione: new Date().toISOString(),
      tags: ['meta', 'facebook', 'instagram', 'whatsapp', 'high-payout'],
      mission: generateGenericMission('web', 'facebook', 'Meta')
    },
    {
      id: 'static-reddit',
      titolo: 'Reddit Bug Bounty',
      programma: 'HackerOne',
      payout: 10000,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/reddit',
      descrizione: 'Reddit copre la piattaforma social, mod tools, awards, ads, community management, user data',
      dataCreazione: new Date().toISOString(),
      tags: ['reddit', 'social', 'community'],
      mission: generateGenericMission('web', 'reddit', 'Reddit')
    },
    {
      id: 'static-youtube',
      titolo: 'YouTube Bug Bounty (via Google VRP)',
      programma: 'Google VRP',
      payout: 31337,
      severita: 'critical',
      assetType: 'web',
      url: 'https://bughunters.google.com/about/rules/5428186903732224/youtube-and-youtube-tv-vulnerability-reward-program',
      descrizione: 'YouTube via Google VRP. Focus su: account takeover, comment XSS, video privacy bypass, channel hijack, monetization bugs',
      dataCreazione: new Date().toISOString(),
      tags: ['youtube', 'google', 'video', 'high-payout'],
      mission: getSpecificMission('google') || generateGenericMission('web', 'youtube', 'YouTube')
    },
    {
      id: 'static-linkedin',
      titolo: 'LinkedIn Bug Bounty',
      programma: 'HackerOne',
      payout: 10000,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/linkedin',
      descrizione: 'LinkedIn copre social network professionale, jobs, recruiter tools, premium features, OAuth, mobile app',
      dataCreazione: new Date().toISOString(),
      tags: ['linkedin', 'social', 'jobs', 'oauth'],
      mission: generateGenericMission('web', 'linkedin', 'LinkedIn')
    },
    {
      id: 'static-dropbox',
      titolo: 'Dropbox Bug Bounty',
      programma: 'HackerOne',
      payout: 12716,
      severita: 'high',
      assetType: 'web',
      url: 'https://hackerone.com/dropbox',
      descrizione: 'Dropbox copre cloud storage, file sharing, sync client, OAuth, API, desktop & mobile apps',
      dataCreazione: new Date().toISOString(),
      tags: ['dropbox', 'storage', 'cloud', 'sync'],
      mission: generateGenericMission('web', 'dropbox', 'Dropbox')
    }
  ]
}

// =================== HELPER FUNCTIONS ===================
const getKnownMaxBounty = (handle: string): number => {
  const knownBounties: Record<string, number> = {
    'github': 30000,
    'google': 31337,
    'uber': 15000,
    'tesla': 15000,
    'twitter': 15000,
    'shopify': 50000,
    'slack': 12000,
    'stripe': 15000,
    'reddit': 10000,
    'okta': 15000,
    'twilio': 10000,
    'sendgrid': 10000,
    'spotify': 10000,
    'dropbox': 12716,
    'square': 15000,
    'pinterest': 5000,
    'gitlab': 12000,
    'automattic': 10000,
    'usaa': 10000,
    'verizon': 10000,
    'snapchat': 15000,
    'yahoo': 10000
  }
  return knownBounties[handle] || 5000
}

const mapSeverita = (severity?: string | number): Severita => {
  if (!severity) return 'medium'
  const s = String(severity).toLowerCase()
  const num = Number(severity)
  if (s.includes('critical') || s === '9' || s === '10' || (!isNaN(num) && num >= 9)) return 'critical'
  if (s.includes('high') || (!isNaN(num) && num >= 7)) return 'high'
  if (s.includes('medium') || (!isNaN(num) && num >= 4 && num < 7)) return 'medium'
  if (s.includes('low') || (!isNaN(num) && num < 4)) return 'low'
  return 'medium'
}

const mapCVESeverity = (score?: number): Severita => {
  if (!score) return 'medium'
  if (score >= 9) return 'critical'
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

const mapAssetType = (type?: string): AssetType => {
  if (!type) return 'web'
  const t = String(type).toLowerCase()
  if (t.includes('web') || t.includes('site') || t.includes('http')) return 'web'
  if (t.includes('mobile') || t.includes('app')) return 'mobile'
  if (t.includes('api') || t.includes('rest')) return 'api'
  if (t.includes('infra')) return 'infrastructure'
  return 'other'
}

// Missioni specifiche per programmi top-tier
const getSpecificMission = (programKey: string): MissionInstructions | null => {
  const missions: Record<string, MissionInstructions> = {
    google: {
      scope: [
        '*.google.com', '*.youtube.com', '*.gmail.com', '*.android.com',
        '*.chromium.org', '*.firebase.google.com', '*.cloud.google.com (solo bug di sicurezza)',
        'App Android e iOS proprietarie Google', 'Prodotti Google Workspace'
      ],
      outOfScope: [
        'Attacchi fisici o social engineering',
        'Test su Google prodotti acquisiti di recente (< 6 mesi)',
        'Bug in software di terze parti (es. kernel Linux upstream)',
        'DoS / DDoS / spam',
        'Problemi di UX/UI senza impatto security',
        'Bug noti già riportati o in fase di fix',
        'Rate limiting issues senza impatto dimostrabile',
        'Self-XSS e Self-CSRF',
        'Vulnerability in Google Play Store (app di terze parti)',
        'Mancanza di security headers non critici'
      ],
      owaspCategories: [
        'A01:2021 - Broken Access Control (focus principale)',
        'A03:2021 - Injection (XSS, template injection)',
        'A05:2021 - Security Misconfiguration (storage buckets)',
        'A07:2021 - Auth bypass (OAuth flows, SSO)',
        'A08:2021 - Software and Data Integrity Failures'
      ],
      testingTechniques: [
        {
          name: 'OAuth Flow Analysis',
          description: 'Google usa OAuth 2.0 pesantemente, molti bug storici sono qui',
          steps: [
            'Intercetta il flusso OAuth con Burp',
            'Modifica redirect_uri, client_id, scope, state',
            "Testa open redirect in redirect_uri",
            'Verifica token leak in referer header',
            'Testa PKCE bypass su mobile app'
          ]
        },
        {
          name: 'Cross-Product IDOR',
          description: 'Un account Google da accesso a 20+ prodotti: cerca IDOR cross-service',
          steps: [
            'Crea risorsa in Drive / Photos / Calendar',
            "Cattura l'ID della risorsa",
            'Prova ad accedere da account Google diverso',
            'Verifica permessi di condivisione',
            'Testa Google Docs shared con link pubblici'
          ]
        }
      ],
      rewardsBySeverity: [
        { severity: 'critical', min: 5000, max: 31337, bonus: 'Bonus per catene di bug' },
        { severity: 'high', min: 1500, max: 5000 },
        { severity: 'medium', min: 500, max: 1500 },
        { severity: 'low', min: 100, max: 500 },
        { severity: 'informational', min: 0, max: 100, bonus: 'Solo bug originali con impatto' }
      ],
      reportingSteps: [
        '1. Usa Google Issue Tracker (issuetracker.google.com) con tag VRP',
        '2. Includi: Title, Target, Summary, Steps, PoC, Impact, Suggested Fix',
        '3. Aspetta triage (fino a 2 settimane, ma critici sono veloci)',
        '4. Rispondi solo se chiedono chiarimenti, non insistere',
        '5. Google NON rilascia CVE per ogni bug, ma conferma il fix',
        '6. Il pagamento avviene tramite Google BugHunter University rewards'
      ],
      toolsRecommended: ['Burp Suite Pro', 'mitmproxy', 'gsutil', 'gcloud CLI', 'firebase-tools', 'Wayback Machine', 'httpx'],
      quickStartGuide: [
        'Step 1: Vai su bughunters.google.com e studia il program policy',
        'Step 2: Iscriviti a Google BugHunter University (gratuita, con certificati)',
        'Step 3: Inizia da Google Docs/Sheets: hanno molti bug di business logic',
        'Step 4: Studia il flusso OAuth: la maggior parte dei bug Google sono qui',
        'Step 5: Testa cross-product: un bug in Drive impatta anche Photos/Gmail',
        'Step 6: Usa Google stesso per enumerarsi: dorks come site:*.google.com inurl:admin',
        'Step 7: Leggi il blog di Project Zero per capire la qualità attesa',
        'Step 8: Sii paziente: Google VRP è molto competitivo'
      ],
      estimatedTimeToFirstReport: '80-200 ore per hunter esperti',
      difficulty: 'expert',
      tips: [
        '💡 Google VRP è IL programma più competitivo: 100+ hunter esperti al giorno',
        '💡 Concentrati su prodotti meno battuti: Google Fit, Google Chat, Cloud Console',
        '💡 I bug accettati sono spesso catene: 2-3 low = 1 high',
        '💡 Studia i writeup su Project Zero: mostrano lo standard qualitativo',
        '💡 Il reverse engineering di app mobile Google è spesso fruttuoso',
        '💡 Google Docs/Sheets collaborative editing ha avuto decine di RCE storici',
        '💡 Account multipli sono essenziali: crea 5-10 account Google per test',
        '💡 Non riportare bug in vendor di terze parti (es. problema in libreria JS)',
        '💡 Il triage è lento, non scoraggiarti se non rispondono in 2 settimane'
      ]
    },
    facebook: {
      scope: [
        '*.facebook.com', '*.instagram.com', '*.messenger.com', '*.whatsapp.com',
        '*.oculus.com', '*.meta.com', 'API GraphQL di Facebook',
        'App mobile Facebook, Instagram, WhatsApp, Messenger'
      ],
      outOfScope: [
        'Rate limiting senza impatto',
        'Clickjacking su pagine non sensibili',
        'Self-XSS',
        'DoS / spam',
        'Bug in prodotti Meta di terze parti',
        'Information disclosure di info già pubbliche',
        'Best practices senza impatto dimostrabile'
      ],
      owaspCategories: [
        'A01:2021 - Broken Access Control (focus su privacy leaks)',
        'A03:2021 - Injection (GraphQL injection)',
        'A04:2021 - Insecure Design (privacy settings)',
        'A07:2021 - Auth bypass (session, token)',
        'A09:2021 - Security Logging Failures'
      ],
      testingTechniques: [
        {
          name: 'Privacy Bypass',
          description: 'Meta è tutto su privacy: cerca modi per bypassare i controlli utente',
          steps: [
            'Crea profilo privato e uno pubblico',
            'Prova a vedere contenuti del privato con edge cases',
            "Testa limit past posts con account compromesso",
            'Verifica friend list leakage',
            'Testa photo tagging privacy bypass'
          ]
        },
        {
          name: 'Mobile App Deep Link',
          description: 'fb:// e instagram:// URI scheme hanno storicamente molti bug',
          steps: [
            'Cattura tutti i deep link con adb logcat',
            'Modifica parametri: fb://profile?id=VICTIM',
            'Testa universal link iOS con apple-app-site-association',
            'Verifica intent filter su Android',
            'Testa WebView con file:// access'
          ]
        }
      ],
      rewardsBySeverity: [
        { severity: 'critical', min: 10000, max: 40000, bonus: 'Fino a $40k per RCE/data leak' },
        { severity: 'high', min: 5000, max: 10000 },
        { severity: 'medium', min: 1000, max: 2500 },
        { severity: 'low', min: 500, max: 1000 },
        { severity: 'informational', min: 0, max: 500 }
      ],
      reportingSteps: [
        '1. Usa il form su facebook.com/whitehat',
        '2. Crea account whitehat dedicato (non deve essere il tuo personale)',
        '3. Includi: Reproduction steps, Impact, PoC video/screenshot, Suggested fix',
        '4. Meta ha il tasso di response più basso del settore: sii paziente',
        '5. Se accettato, pagamento in 60-90 giorni',
        '6. Disclosure: 90 giorni o quando Meta rilascia fix'
      ],
      toolsRecommended: ['Burp Suite Pro', 'mitmproxy', 'Frida', 'Objection', 'jadx', 'apktool', 'GraphQL Voyager', 'Wireshark'],
      quickStartGuide: [
        'Step 1: Studia facebook.com/whitehat e i recenti writeup Meta',
        'Step 2: Crea account di test multipli: serve una rete di amici fake',
        'Step 3: Le app mobile sono il focus: decompila e cerca API nascoste',
        'Step 4: Testa business.facebook.com e ads manager: meno battuti',
        'Step 5: Workplace (ora Meta Workplace) ha programma separato',
        'Step 6: I bug di privacy pagano molto: pensa cosa può vedere lattaccante',
        'Step 7: Leggi il blog Meta Bug Bounty per pattern di bug accettati'
      ],
      estimatedTimeToFirstReport: '60-150 ore',
      difficulty: 'expert',
      tips: [
        '💡 Meta paga BENE ma è IL programma più difficile: 1000+ hunter attivi',
        '💡 I bug cross-product (Facebook → Instagram) pagano molto di più',
        '💡 Account takeover con impatto su pagine business = $$$',
        '💡 Le app mobile hanno molti bug di deep link e intent filter',
        '💡 Meta usa MOLTISSIMO GraphQL: batching è la tua arma',
        '💡 Workplace, Portal, Oculus sono nicchie sotto-esplorate',
        '💡 Il tempo di triage è lentissimo (30+ giorni), non disperare',
        '💡 Non riportare bug di rate limit o UI/UX: vengono rifiutati'
      ]
    }
  }

  return missions[programKey] || null
}
