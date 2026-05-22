import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Army, PlayerProfile } from '../types'
import { useArmiesStore } from '../store/armies'
import { useMatchesStore } from '../store/matches'
import { Modal } from './Modal'
import { ArmyPickerModal } from './ArmyPickerModal'

interface Props {
  onClose: () => void
}

type PickerSlot = 'one' | 'two' | null

export function NewMatchModal({ onClose }: Props) {
  const navigate = useNavigate()
  const players = useMatchesStore((s) => s.players)
  const createMatch = useMatchesStore((s) => s.createMatch)
  const armies = useArmiesStore((s) => s.armies)
  const favoriteIDs = useArmiesStore((s) => s.favoriteIDs)
  const ownedIDs = useArmiesStore((s) => s.ownedIDs)

  const sortedArmies = useMemo(() => {
    const favSet = new Set(favoriteIDs)
    const ownedSet = new Set(ownedIDs)
    return [...armies].sort((a, b) => {
      const aFav = favSet.has(a.id)
      const bFav = favSet.has(b.id)
      if (aFav !== bFav) return aFav ? -1 : 1
      const aOwned = ownedSet.has(a.id)
      const bOwned = ownedSet.has(b.id)
      if (aOwned !== bOwned) return aOwned ? -1 : 1
      return a.faction.localeCompare(b.faction)
    })
  }, [armies, favoriteIDs, ownedIDs])

  const primary = players.find((p) => p.isPrimaryUser) ?? players[0]
  const secondary = players.find((p) => p.id !== primary?.id)

  const [playerOneID, setPlayerOneID] = useState<string>(primary?.id ?? '')
  const [playerTwoID, setPlayerTwoID] = useState<string>(secondary?.id ?? '')
  const [armyOne, setArmyOne] = useState<Army | null>(sortedArmies[0] ?? null)
  const [armyTwo, setArmyTwo] = useState<Army | null>(sortedArmies[1] ?? null)
  const [picker, setPicker] = useState<PickerSlot>(null)

  const valid =
    playerOneID &&
    playerTwoID &&
    playerOneID !== playerTwoID &&
    armyOne &&
    armyTwo

  const handleCreate = () => {
    if (!valid || !armyOne || !armyTwo) return
    const match = createMatch({
      playerOneID,
      playerTwoID,
      playerOneArmyID: armyOne.id,
      playerTwoArmyID: armyTwo.id,
    })
    onClose()
    navigate(`/matches/${match.id}`)
  }

  return (
    <>
      <Modal
        title="Nueva partida"
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/12"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!valid}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-opacity disabled:opacity-40"
            >
              Crear
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <SlotBlock
            label="Jugador 1"
            players={players}
            selectedID={playerOneID}
            excludeID={playerTwoID}
            onSelect={setPlayerOneID}
            army={armyOne}
            onPickArmy={() => setPicker('one')}
          />
          <SlotBlock
            label="Jugador 2"
            players={players}
            selectedID={playerTwoID}
            excludeID={playerOneID}
            onSelect={setPlayerTwoID}
            army={armyTwo}
            onPickArmy={() => setPicker('two')}
          />
        </div>
      </Modal>

      {picker && (
        <ArmyPickerModal
          title={picker === 'one' ? 'Ejército jugador 1' : 'Ejército jugador 2'}
          onClose={() => setPicker(null)}
          onSelect={(army) => {
            if (picker === 'one') setArmyOne(army)
            else setArmyTwo(army)
            setPicker(null)
          }}
        />
      )}
    </>
  )
}

function SlotBlock({
  label,
  players,
  selectedID,
  excludeID,
  onSelect,
  army,
  onPickArmy,
}: {
  label: string
  players: PlayerProfile[]
  selectedID: string
  excludeID: string
  onSelect: (id: string) => void
  army: Army | null
  onPickArmy: () => void
}) {
  return (
    <section className="rounded-2xl bg-white/4 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
        {label}
      </p>
      <select
        value={selectedID}
        onChange={(e) => onSelect(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/10 bg-[#0f1d36] px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
      >
        <option value="">— elegir jugador —</option>
        {players
          .filter((p) => p.id !== excludeID)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isPrimaryUser ? ' (You)' : ''}
            </option>
          ))}
      </select>

      <button
        type="button"
        onClick={onPickArmy}
        className="flex w-full items-center gap-3 rounded-xl bg-white/8 px-3 py-2 text-left hover:bg-white/12"
      >
        {army?.thumbnailImageName ? (
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
          {army ? (
            <>
              <p className="truncate text-sm font-semibold text-white">
                {army.spearheadName}
              </p>
              <p className="truncate text-xs text-white/60">{army.faction}</p>
            </>
          ) : (
            <p className="text-sm text-white/60">Elegir ejército</p>
          )}
        </div>
      </button>
    </section>
  )
}
