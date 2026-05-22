import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { MatchRecord, MatchRoundScore, PlayerProfile } from '../types'

const idbStorage = {
  getItem: async (name: string) => {
    const value = await idbGet<string>(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  },
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function makeRound(roundNumber: number): MatchRoundScore {
  return {
    id: uuid(),
    roundNumber,
    playerOnePoints: 0,
    playerTwoPoints: 0,
  }
}

function defaultRounds(): MatchRoundScore[] {
  return [1, 2, 3, 4].map(makeRound)
}

interface MatchesState {
  players: PlayerProfile[]
  matches: MatchRecord[]
  hydrated: boolean
  ensureSeedPlayer: () => void
  addPlayer: (name: string) => PlayerProfile
  removePlayer: (id: string) => void
  setPrimaryPlayer: (id: string) => void
  createMatch: (input: {
    playerOneID: string
    playerTwoID: string
    playerOneArmyID: string
    playerTwoArmyID: string
  }) => MatchRecord
  updateRound: (
    matchID: string,
    roundID: string,
    patch: Partial<Pick<MatchRoundScore, 'playerOnePoints' | 'playerTwoPoints'>>
  ) => void
  addRound: (matchID: string) => void
  deleteMatch: (id: string) => void
}

export const useMatchesStore = create<MatchesState>()(
  persist(
    (set, get) => ({
      players: [],
      matches: [],
      hydrated: false,

      ensureSeedPlayer: () => {
        if (get().players.length > 0) return
        set({
          players: [{ id: uuid(), name: 'Manu', isPrimaryUser: true }],
        })
      },

      addPlayer: (name) => {
        const trimmed = name.trim()
        const player: PlayerProfile = {
          id: uuid(),
          name: trimmed,
          isPrimaryUser: get().players.length === 0,
        }
        set((s) => ({ players: [...s.players, player] }))
        return player
      },

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      setPrimaryPlayer: (id) =>
        set((s) => ({
          players: s.players.map((p) => ({
            ...p,
            isPrimaryUser: p.id === id,
          })),
        })),

      createMatch: ({
        playerOneID,
        playerTwoID,
        playerOneArmyID,
        playerTwoArmyID,
      }) => {
        const now = new Date().toISOString()
        const match: MatchRecord = {
          id: uuid(),
          playerOneID,
          playerTwoID,
          playerOneArmyID,
          playerTwoArmyID,
          rounds: defaultRounds(),
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ matches: [match, ...s.matches] }))
        return match
      },

      updateRound: (matchID, roundID, patch) =>
        set((s) => ({
          matches: s.matches.map((m) => {
            if (m.id !== matchID) return m
            return {
              ...m,
              rounds: m.rounds.map((r) =>
                r.id === roundID
                  ? {
                      ...r,
                      ...patch,
                      playerOnePoints: Math.max(
                        0,
                        patch.playerOnePoints ?? r.playerOnePoints
                      ),
                      playerTwoPoints: Math.max(
                        0,
                        patch.playerTwoPoints ?? r.playerTwoPoints
                      ),
                    }
                  : r
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      addRound: (matchID) =>
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === matchID
              ? {
                  ...m,
                  rounds: [...m.rounds, makeRound(m.rounds.length + 1)],
                  updatedAt: new Date().toISOString(),
                }
              : m
          ),
        })),

      deleteMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),
    }),
    {
      name: 'wh-matches',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.ensureSeedPlayer()
        if (state) state.hydrated = true
      },
    }
  )
)

export function matchScoreTotals(match: MatchRecord): {
  playerOne: number
  playerTwo: number
} {
  return match.rounds.reduce(
    (acc, r) => ({
      playerOne: acc.playerOne + r.playerOnePoints,
      playerTwo: acc.playerTwo + r.playerTwoPoints,
    }),
    { playerOne: 0, playerTwo: 0 }
  )
}

export function sortedMatches(matches: MatchRecord[]): MatchRecord[] {
  return [...matches].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}
