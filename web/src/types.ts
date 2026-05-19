export interface Army {
  id: string
  faction: string
  spearheadName: string
  grandAlliance: string
  modelCount: number | null
  pointsValue: number | null
  released: boolean
  inPrint: boolean
  owned: boolean
  details: string
  quickRulesFileName: string | null
  thumbnailImageName: string | null
  quickRulesImageName: string | null
  officialPDFURL: string | null
  imageURL: string | null
}

export interface PlayerProfile {
  id: string
  name: string
  isPrimaryUser: boolean
}

export interface MatchRoundScore {
  id: string
  roundNumber: number
  playerOnePoints: number
  playerTwoPoints: number
}

export interface MatchRecord {
  id: string
  playerOneID: string
  playerTwoID: string
  playerOneArmyID: string
  playerTwoArmyID: string
  rounds: MatchRoundScore[]
  createdAt: string
  updatedAt: string
}

export interface DataVersion {
  version: string
  armiesHash: string
  armyCount: number
}
