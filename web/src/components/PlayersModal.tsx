import { useMemo, useState } from 'react'
import { playerStats, useMatchesStore } from '../store/matches'
import type { PlayerProfile } from '../types'
import { Modal } from './Modal'

interface Props {
  onClose: () => void
}

export function PlayersModal({ onClose }: Props) {
  const players = useMatchesStore((s) => s.players)
  const matches = useMatchesStore((s) => s.matches)
  const addPlayer = useMatchesStore((s) => s.addPlayer)
  const removePlayer = useMatchesStore((s) => s.removePlayer)
  const setPrimaryPlayer = useMatchesStore((s) => s.setPrimaryPlayer)

  const [newName, setNewName] = useState('')

  const statsByID = useMemo(() => {
    const map = new Map<string, ReturnType<typeof playerStats>>()
    for (const p of players) map.set(p.id, playerStats(p.id, matches))
    return map
  }, [players, matches])

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    addPlayer(trimmed)
    setNewName('')
  }

  const handleDelete = (player: PlayerProfile) => {
    const used = matches.some(
      (m) => m.playerOneID === player.id || m.playerTwoID === player.id
    )
    const msg = used
      ? `${player.name} está en partidas existentes. ¿Eliminar igual?`
      : `¿Eliminar a ${player.name}?`
    if (!window.confirm(msg)) return
    removePlayer(player.id)
  }

  return (
    <Modal title="Jugadores" onClose={onClose} fullHeight>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder="Nombre"
          className="flex-1 rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-opacity disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {players.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/55">
          No hay jugadores todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {players.map((p) => {
            const s = statsByID.get(p.id) ?? {
              wins: 0,
              draws: 0,
              losses: 0,
              played: 0,
            }
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {p.name}
                    </p>
                  </div>
                  {p.isPrimaryUser ? (
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      You
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryPlayer(p.id)}
                      className="rounded-full bg-white/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 hover:bg-white/12"
                    >
                      Make You
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="rounded-full bg-white/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 hover:bg-red-500/20 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold tabular-nums">
                  <StatChip label="G" value={s.wins} tone="win" />
                  <StatChip label="E" value={s.draws} tone="draw" />
                  <StatChip label="P" value={s.losses} tone="loss" />
                  <span className="ml-auto text-white/45">
                    {s.played} {s.played === 1 ? 'partida' : 'partidas'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'win' | 'draw' | 'loss'
}) {
  const toneClass =
    tone === 'win'
      ? 'bg-green-500/20 text-green-300'
      : tone === 'loss'
        ? 'bg-red-500/20 text-red-300'
        : 'bg-white/10 text-white/75'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${toneClass}`}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span>{value}</span>
    </span>
  )
}
