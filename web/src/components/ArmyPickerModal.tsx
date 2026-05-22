import { useMemo, useState } from 'react'
import type { Army } from '../types'
import { useArmiesStore } from '../store/armies'
import { armySearchText } from '../lib/armyId'
import { Modal } from './Modal'
import { SearchIcon } from './Icons'

interface Props {
  title: string
  onClose: () => void
  onSelect: (army: Army) => void
}

export function ArmyPickerModal({ title, onClose, onSelect }: Props) {
  const armies = useArmiesStore((s) => s.armies)
  const favoriteIDs = useArmiesStore((s) => s.favoriteIDs)
  const ownedIDs = useArmiesStore((s) => s.ownedIDs)
  const [search, setSearch] = useState('')

  const list = useMemo(() => {
    const favSet = new Set(favoriteIDs)
    const ownedSet = new Set(ownedIDs)
    const query = search
      .trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()

    const filtered = query
      ? armies.filter((a) => armySearchText(a).includes(query))
      : armies

    return filtered.sort((a, b) => {
      const aFav = favSet.has(a.id)
      const bFav = favSet.has(b.id)
      if (aFav !== bFav) return aFav ? -1 : 1
      const aOwned = ownedSet.has(a.id)
      const bOwned = ownedSet.has(b.id)
      if (aOwned !== bOwned) return aOwned ? -1 : 1
      if (a.faction !== b.faction) return a.faction.localeCompare(b.faction)
      return a.spearheadName.localeCompare(b.spearheadName)
    })
  }, [armies, favoriteIDs, ownedIDs, search])

  return (
    <div className="z-50">
      <Modal title={title} onClose={onClose} fullHeight>
        <div className="relative mb-3">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar"
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-white/8 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none"
          />
        </div>

        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/60">
            Sin resultados.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {list.map((army) => (
              <li key={army.id}>
                <button
                  type="button"
                  onClick={() => onSelect(army)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/4 px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  {army.thumbnailImageName ? (
                    <img
                      src={`/data/ArmyThumbnails/${army.thumbnailImageName}`}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-lg object-cover object-top"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {army.spearheadName}
                    </p>
                    <p className="truncate text-xs text-white/60">
                      {army.faction}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
