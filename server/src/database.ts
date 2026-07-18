import { writeFileSync, readFileSync, existsSync } from 'fs'
import { BugBounty } from './types'

const DB_FILE = './bounties.json'

export const initDB = () => {
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify([]))
  }
}

export const saveBounties = (bounties: BugBounty[]) => {
  writeFileSync(DB_FILE, JSON.stringify(bounties, null, 2))
}

export const getBounties = (): BugBounty[] => {
  if (!existsSync(DB_FILE)) return []
  const data = readFileSync(DB_FILE, 'utf-8')
  return JSON.parse(data)
}