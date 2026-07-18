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
  mission?: MissionInstructions
}

export type Severita = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type AssetType = 'web' | 'mobile' | 'api' | 'infrastructure' | 'hardware' | 'other'

export interface MissionInstructions {
  scope: string[]
  outOfScope: string[]
  owaspCategories: string[]
  testingTechniques: TestingTechnique[]
  rewardsBySeverity: RewardTier[]
  reportingSteps: string[]
  toolsRecommended: string[]
  quickStartGuide: string[]
  estimatedTimeToFirstReport: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tips: string[]
}

export interface TestingTechnique {
  name: string
  description: string
  steps: string[]
  examplePayload?: string
}

export interface RewardTier {
  severity: Severita
  min: number
  max: number
  bonus?: string
}