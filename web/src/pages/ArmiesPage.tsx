import { useEffect } from 'react'
import { AppVersion } from '../components/AppVersion'
import { ArmyCard } from '../components/ArmyCard'
import { PinFilledIcon, PinIcon, SearchIcon } from '../components/Icons'
import { useArmiesStore, useFilteredArmies } from '../store/armies'

export function ArmiesPage() {
  const loadArmies = useArmiesStore((s) => s.loadArmies)
  const isLoading = useArmiesStore((s) => s.isLoading)
  const error = useArmiesStore((s) => s.error)
  const searchText = useArmiesStore((s) => s.searchText)
  const setSearchText = useArmiesStore((s) => s.setSearchText)
  const showFavoritesOnly = useArmiesStore((s) => s.showFavoritesOnly)
  const toggleShowFavoritesOnly = useArmiesStore(
    (s) => s.toggleShowFavoritesOnly
  )
  const favoriteIDs = useArmiesStore((s) => s.favoriteIDs)
  const ownedIDs = useArmiesStore((s) => s.ownedIDs)
  const toggleFavorite = useArmiesStore((s) => s.toggleFavorite)
  const toggleOwned = useArmiesStore((s) => s.toggleOwned)

  const armies = useFilteredArmies()
  const favSet = new Set(favoriteIDs)
  const ownedSet = new Set(ownedIDs)

  useEffect(() => {
    void loadArmies()
  }, [loadArmies])

  return (
    <div
      className="mx-auto max-w-2xl px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Warhammer</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/65">
              {armies.length}
            </span>
            <button
              type="button"
              onClick={toggleShowFavoritesOnly}
              aria-pressed={showFavoritesOnly}
              aria-label="Mostrar solo favoritos"
              className={`rounded-full p-2 transition-colors ${
                showFavoritesOnly
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-white/8 text-white/70 hover:bg-white/12'
              }`}
            >
              {showFavoritesOnly ? (
                <PinFilledIcon size={18} />
              ) : (
                <PinIcon size={18} />
              )}
            </button>
          </div>
        </div>
        <div className="mt-0.5">
          <AppVersion />
        </div>
      </header>

      <div className="relative mb-4">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
        />
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar facción o spearhead"
          className="w-full rounded-xl border border-white/10 bg-white/8 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none"
        />
      </div>

      {isLoading && armies.length === 0 && (
        <p className="py-8 text-center text-white/70">Cargando ejércitos…</p>
      )}

      {error && armies.length === 0 && (
        <p className="py-8 text-center text-red-300">
          No se pudieron cargar los ejércitos: {error}
        </p>
      )}

      {!isLoading && !error && armies.length === 0 && (
        <p className="py-8 text-center text-white/70">
          {showFavoritesOnly
            ? 'No hay ejércitos marcados como favoritos.'
            : 'No hay resultados para esta búsqueda.'}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {armies.map((army) => (
          <li key={army.id}>
            <ArmyCard
              army={army}
              isFavorite={favSet.has(army.id)}
              isOwned={ownedSet.has(army.id)}
              onToggleFavorite={() => toggleFavorite(army.id)}
              onToggleOwned={() => toggleOwned(army.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
