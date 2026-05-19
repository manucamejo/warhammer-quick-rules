import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Army } from '../types'
import { armySearchText, makeArmyId } from '../lib/armyId'

interface RawArmy {
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

interface ArmiesState {
  armies: Army[]
  isLoading: boolean
  error: string | null
  searchText: string
  showFavoritesOnly: boolean
  favoriteIDs: string[]
  ownedIDs: string[]
  loadArmies: () => Promise<void>
  setSearchText: (text: string) => void
  toggleShowFavoritesOnly: () => void
  toggleFavorite: (id: string) => void
  toggleOwned: (id: string) => void
}

interface PersistedSlice {
  favoriteIDs: string[]
  ownedIDs: string[]
}

export const useArmiesStore = create<ArmiesState>()(
  persist(
    (set, get) => ({
      armies: [],
      isLoading: false,
      error: null,
      searchText: '',
      showFavoritesOnly: false,
      favoriteIDs: [],
      ownedIDs: [],

      loadArmies: async () => {
        if (get().armies.length > 0 || get().isLoading) return
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/data/armies.json')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const raw = (await res.json()) as RawArmy[]
          const armies: Army[] = raw.map((row) => ({
            ...row,
            id: makeArmyId(row.faction, row.spearheadName),
          }))
          set({ armies, isLoading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load armies',
            isLoading: false,
          })
        }
      },

      setSearchText: (text) => set({ searchText: text }),
      toggleShowFavoritesOnly: () =>
        set((s) => ({ showFavoritesOnly: !s.showFavoritesOnly })),

      toggleFavorite: (id) =>
        set((s) => ({
          favoriteIDs: s.favoriteIDs.includes(id)
            ? s.favoriteIDs.filter((x) => x !== id)
            : [...s.favoriteIDs, id],
        })),

      toggleOwned: (id) =>
        set((s) => ({
          ownedIDs: s.ownedIDs.includes(id)
            ? s.ownedIDs.filter((x) => x !== id)
            : [...s.ownedIDs, id],
        })),
    }),
    {
      name: 'wh-armies',
      partialize: (s): PersistedSlice => ({
        favoriteIDs: s.favoriteIDs,
        ownedIDs: s.ownedIDs,
      }),
    }
  )
)

export function useFilteredArmies(): Army[] {
  const { armies, favoriteIDs, ownedIDs, searchText, showFavoritesOnly } =
    useArmiesStore()
  const favSet = new Set(favoriteIDs)
  const ownedSet = new Set(ownedIDs)
  const query = searchText
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

  const visible = showFavoritesOnly
    ? armies.filter((a) => favSet.has(a.id))
    : armies
  const matching = query
    ? visible.filter((a) => armySearchText(a).includes(query))
    : visible

  return [...matching].sort((a, b) => {
    const aFav = favSet.has(a.id)
    const bFav = favSet.has(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1
    const aOwned = ownedSet.has(a.id)
    const bOwned = ownedSet.has(b.id)
    if (aOwned !== bOwned) return aOwned ? -1 : 1
    if (a.faction !== b.faction)
      return a.faction.localeCompare(b.faction)
    return a.spearheadName.localeCompare(b.spearheadName)
  })
}
