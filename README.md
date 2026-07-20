# BugBounty Tracker

Tracker privato con grafica cyberpunk per monitorare i bug bounty di tutti i principali programmi.

## Setup

```bash
npm install
npm run dev
```

Server backend: http://localhost:5000
Client frontend: http://localhost:3000

## Features

- Filtri per payout, severità, asset type
- Scraping automatico su 9 piattaforme
- Grafica cyberpunk neon responsive (mobile-friendly)
- Statistiche dashboard
- PWA installabile su Android/iOS

## API

- `GET /api/bounties` - Lista tutti i bounty
- `GET /api/scrape` - Avvia scraping manuale

## Piattaforme Supportate

Vedi PLATFORMS.md per lista completa di 20+ piattaforme.

## To Do

- [ ] Integrare API reali con API key
- [ ] Notifiche push
- [ ] Export CSV
- [ ] Dark/Light mode
- [ ] Widget per home screen