import { useMemo, useState } from 'react'
import { AppVersion } from '../components/AppVersion'
import {
  headToHead,
  playerStats,
  useMatchesStore,
} from '../store/matches'
import type { PlayerProfile } from '../types'

export function PlayersPage() {
  const players = useMatchesStore((s) => s.players)
  const matches = useMatchesStore((s) => s.matches)
  const addPlayer = useMatchesStore((s) => s.addPlayer)
  const removePlayer = useMatchesStore((s) => s.removePlayer)
  const setPrimaryPlayer = useMatchesStore((s) => s.setPrimaryPlayer)

  const [newName, setNewName] = useState('')

  const primary = players.find((p) => p.isPrimaryUser)

  const statsByID = useMemo(() => {
    const map = new Map<string, ReturnType<typeof playerStats>>()
    for (const p of players) map.set(p.id, playerStats(p.id, matches))
    return map
  }, [players, matches])

  const h2hByID = useMemo(() => {
    if (!primary) return new Map<string, ReturnType<typeof headToHead>>()
    const map = new Map<string, ReturnType<typeof headToHead>>()
    for (const p of players) {
      if (p.id === primary.id) continue
      map.set(p.id, headToHead(primary.id, p.id, matches))
    }
    return map
  }, [players, matches, primary])

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
    <div
      className="mx-auto max-w-2xl px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Warhammer Quick Rules
          </h1>
        </div>
        <div className="mt-0.5">
          <AppVersion />
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder="Nuevo jugador"
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
        <p className="py-8 text-center text-sm text-white/55">
          No hay jugadores todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {players.map((p) => {
            const s = statsByID.get(p.id)
            const h2h = h2hByID.get(p.id)
            const isPrimary = p.isPrimaryUser
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-white/10 bg-[#1a2b4a] p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">
                      {p.name}
                    </p>
                  </div>
                  {isPrimary ? (
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

                {s && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Total
                    </p>
                    <StatsRow stats={s} />
                  </div>
                )}

                {!isPrimary && h2h && primary && h2h.played > 0 && (
                  <div className="mt-3 rounded-xl bg-white/4 p-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Contra {primary.name}
                    </p>
                    <StatsRow stats={h2h} primaryName={primary.name} otherName={p.name} />
                  </div>
                )}

                {!isPrimary && h2h && primary && h2h.played === 0 && (
                  <p className="mt-3 text-xs text-white/45">
                    Sin partidas contra {primary.name}.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatsRow({
  stats,
  primaryName,
  otherName,
}: {
  stats: ReturnType<typeof playerStats>
  primaryName?: string
  otherName?: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
      <StatChip label="G" value={stats.wins} tone="win" />
      <StatChip label="E" value={stats.draws} tone="draw" />
      <StatChip label="P" value={stats.losses} tone="loss" />
      <span className="ml-auto text-[11px] text-white/45">
        {primaryName && otherName
          ? `desde ${primaryName}`
          : `${stats.played} ${stats.played === 1 ? 'partida' : 'partidas'}`}
      </span>
    </div>
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
