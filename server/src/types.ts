export interface BugBounty {
  id: string
  titolo: string
  programma: string
  payout: number
  severita: Severita
  assetType: AssetType
  url: string
  descrizione: string
  dataCreazione: string
  tags: string[]
}

export type Severita = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type AssetType = 'web' | 'mobile' | 'api' | 'infrastructure' | 'hardware' | 'other'