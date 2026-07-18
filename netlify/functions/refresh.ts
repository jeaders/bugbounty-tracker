// Netlify Function per trigger on-demand DB refresh
// Trigger: POST /.netlify/functions/refresh
// Auth: richiede header x-refresh-secret (configurato su Netlify env)
// In produzione: triggerare la GitHub Actions via API
import type { Handler } from '@netlify/functions'

const GITHUB_REPO = process.env.GITHUB_REPO || ''
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

const handler: Handler = async (event) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-refresh-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Auth check
  const secret = event.headers['x-refresh-secret']
  const expectedSecret = process.env.REFRESH_SECRET || ''

  if (!expectedSecret || secret !== expectedSecret) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: invalid or missing refresh secret' })
    }
  }

  // Trigger GitHub Actions workflow_dispatch
  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'GitHub integration not configured',
        hint: 'Set GITHUB_REPO and GITHUB_TOKEN env vars'
      })
    }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/daily-scrape.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({ ref: 'main', inputs: { force: 'true' } })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'GitHub API error', details: error })
      }
    }

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({
        message: 'Refresh triggered',
        note: 'Il DB verrà aggiornato in pochi minuti. Ricarica la pagina dopo.'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal error',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

export { handler }
