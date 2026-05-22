import { useState } from 'react'
import { useMatchesStore } from '../store/matches'
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
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{p.name}</p>
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
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
