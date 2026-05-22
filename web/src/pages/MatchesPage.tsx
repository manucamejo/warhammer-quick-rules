import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppVersion } from '../components/AppVersion'
import { NewMatchModal } from '../components/NewMatchModal'
import { useArmiesStore } from '../store/armies'
import {
  matchScoreTotals,
  sortedMatches,
  useMatchesStore,
} from '../store/matches'
import type { Army, MatchRecord, PlayerProfile } from '../types'

export function MatchesPage() {
  const players = useMatchesStore((s) => s.players)
  const matches = useMatchesStore((s) => s.matches)
  const deleteMatch = useMatchesStore((s) => s.deleteMatch)
  const armies = useArmiesStore((s) => s.armies)
  const loadArmies = useArmiesStore((s) => s.loadArmies)

  const [showNewMatch, setShowNewMatch] = useState(false)

  useEffect(() => {
    void loadArmies()
  }, [loadArmies])

  const armyByID = useMemo(() => {
    const map = new Map<string, Army>()
    for (const a of armies) map.set(a.id, a)
    return map
  }, [armies])

  const playerByID = useMemo(() => {
    const map = new Map<string, PlayerProfile>()
    for (const p of players) map.set(p.id, p)
    return map
  }, [players])

  const orderedMatches = useMemo(() => sortedMatches(matches), [matches])

  const handleDeleteMatch = (match: MatchRecord) => {
    if (!window.confirm('¿Eliminar esta partida?')) return
    deleteMatch(match.id)
  }

  return (
    <div
      className="mx-auto max-w-2xl px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Warhammer Quick Rules</h1>
        </div>
        <div className="mt-0.5">
          <AppVersion />
        </div>
      </header>

      <section>
        <SectionHeader
          title="Battles"
          action={
            <button
              type="button"
              onClick={() => setShowNewMatch(true)}
              disabled={players.length < 2 || armies.length === 0}
              className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-[#1a1a1a] transition-opacity disabled:opacity-40"
            >
              + New Battle
            </button>
          }
        />
        {players.length < 2 && (
          <EmptyHint>
            Agregá al menos 2 jugadores en la pestaña Players para empezar una partida.
          </EmptyHint>
        )}
        {orderedMatches.length === 0 && players.length >= 2 && (
          <EmptyHint>Todavía no hay partidas.</EmptyHint>
        )}
        <ul className="flex flex-col gap-3">
          {orderedMatches.map((m) => (
            <MatchListItem
              key={m.id}
              match={m}
              playerByID={playerByID}
              armyByID={armyByID}
              onDelete={() => handleDeleteMatch(m)}
            />
          ))}
        </ul>
      </section>

      {showNewMatch && (
        <NewMatchModal onClose={() => setShowNewMatch(false)} />
      )}
    </div>
  )
}

function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
        {title}
      </h2>
      {action}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-white/55">{children}</p>
}

function MatchListItem({
  match,
  playerByID,
  armyByID,
  onDelete,
}: {
  match: MatchRecord
  playerByID: Map<string, PlayerProfile>
  armyByID: Map<string, Army>
  onDelete: () => void
}) {
  const totals = matchScoreTotals(match)
  const p1 = playerByID.get(match.playerOneID)
  const p2 = playerByID.get(match.playerTwoID)
  const a1 = armyByID.get(match.playerOneArmyID)
  const a2 = armyByID.get(match.playerTwoArmyID)
  const winningOne = totals.playerOne > totals.playerTwo
  const winningTwo = totals.playerTwo > totals.playerOne

  return (
    <li>
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a2b4a]">
        <Link
          to={`/matches/${match.id}`}
          className="block px-4 py-3 transition-opacity active:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {p1?.name ?? '—'} vs {p2?.name ?? '—'}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/60">
                {a1?.spearheadName ?? '—'} · {a2?.spearheadName ?? '—'}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline gap-1.5 text-lg font-bold tabular-nums">
              <span className={winningOne ? 'text-amber-300' : 'text-white/85'}>
                {totals.playerOne}
              </span>
              <span className="text-white/40">-</span>
              <span className={winningTwo ? 'text-amber-300' : 'text-white/85'}>
                {totals.playerTwo}
              </span>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            {formatTimestamp(match.updatedAt)}
          </p>
        </Link>
        <div className="flex justify-end border-t border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 hover:bg-red-500/20 hover:text-red-300"
          >
            Eliminar
          </button>
        </div>
      </article>
    </li>
  )
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
