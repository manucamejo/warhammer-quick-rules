import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, ZoomInIcon } from '../components/Icons'
import { QuickRulesViewer } from '../components/QuickRulesViewer'
import { useArmiesStore } from '../store/armies'
import {
  matchScoreTotals,
  useMatchesStore,
} from '../store/matches'
import type { Army, MatchRoundScore, PlayerProfile } from '../types'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const match = useMatchesStore((s) =>
    s.matches.find((m) => m.id === id)
  )
  const players = useMatchesStore((s) => s.players)
  const updateRound = useMatchesStore((s) => s.updateRound)
  const addRound = useMatchesStore((s) => s.addRound)
  const deleteMatch = useMatchesStore((s) => s.deleteMatch)

  const armies = useArmiesStore((s) => s.armies)
  const loadArmies = useArmiesStore((s) => s.loadArmies)

  const [zoomSrc, setZoomSrc] = useState<{ src: string; alt: string } | null>(
    null
  )

  useEffect(() => {
    void loadArmies()
  }, [loadArmies])

  if (!match) {
    return (
      <div
        className="mx-auto max-w-2xl px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <BackLink />
        <p className="mt-8 text-center text-white/70">Partida no encontrada.</p>
      </div>
    )
  }

  const p1 = players.find((p) => p.id === match.playerOneID)
  const p2 = players.find((p) => p.id === match.playerTwoID)
  const a1 = armies.find((a) => a.id === match.playerOneArmyID)
  const a2 = armies.find((a) => a.id === match.playerTwoArmyID)
  const totals = matchScoreTotals(match)

  const handleDelete = () => {
    if (!window.confirm('¿Eliminar esta partida?')) return
    deleteMatch(match.id)
    navigate('/matches')
  }

  return (
    <div
      className="mx-auto max-w-2xl px-4 pb-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <BackLink />
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/75 hover:bg-red-500/20 hover:text-red-300"
        >
          Eliminar partida
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#1a2b4a] shadow-lg shadow-black/30">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
          <PlayerBlock player={p1} army={a1} align="left" />
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-white">
              <span
                className={
                  totals.playerOne > totals.playerTwo ? 'text-amber-300' : ''
                }
              >
                {totals.playerOne}
              </span>
              <span className="mx-1.5 text-white/40">-</span>
              <span
                className={
                  totals.playerTwo > totals.playerOne ? 'text-amber-300' : ''
                }
              >
                {totals.playerTwo}
              </span>
            </p>
          </div>
          <PlayerBlock player={p2} army={a2} align="right" />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/10 bg-[#1a2b4a] p-4 shadow-lg shadow-black/30">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          Rondas
        </h2>
        <ul className="flex flex-col gap-2">
          {match.rounds.map((round) => (
            <RoundRow
              key={round.id}
              round={round}
              onChange={(patch) => updateRound(match.id, round.id, patch)}
            />
          ))}
        </ul>
        <button
          type="button"
          onClick={() => addRound(match.id)}
          className="mt-3 w-full rounded-xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/12"
        >
          + Add Round
        </button>
      </section>

      <section className="mt-4 rounded-3xl border border-white/10 bg-[#1a2b4a] p-4 shadow-lg shadow-black/30">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          Quick Rules
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickRulesCard
            army={a1}
            playerName={p1?.name ?? '—'}
            onOpen={(src, alt) => setZoomSrc({ src, alt })}
          />
          <QuickRulesCard
            army={a2}
            playerName={p2?.name ?? '—'}
            onOpen={(src, alt) => setZoomSrc({ src, alt })}
          />
        </div>
      </section>

      {zoomSrc && (
        <QuickRulesViewer
          src={zoomSrc.src}
          alt={zoomSrc.alt}
          onClose={() => setZoomSrc(null)}
        />
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/matches"
      aria-label="Volver"
      className="inline-flex items-center gap-1 text-sm font-medium text-white/75 hover:text-white"
    >
      <ChevronLeftIcon size={16} />
      Matches
    </Link>
  )
}

function PlayerBlock({
  player,
  army,
  align,
}: {
  player: PlayerProfile | undefined
  army: Army | undefined
  align: 'left' | 'right'
}) {
  const alignClass = align === 'left' ? 'items-start' : 'items-end'
  const textAlignClass = align === 'left' ? 'text-left' : 'text-right'
  return (
    <div className={`flex min-w-0 flex-col ${alignClass}`}>
      {army?.thumbnailImageName ? (
        <img
          src={`/data/ArmyThumbnails/${army.thumbnailImageName}`}
          alt=""
          loading="lazy"
          className="h-12 w-12 rounded-xl object-cover object-top"
        />
      ) : (
        <div className="h-12 w-12 rounded-xl bg-white/10" />
      )}
      <p
        className={`mt-1.5 truncate text-sm font-semibold text-white ${textAlignClass} w-full`}
      >
        {player?.name ?? '—'}
        {player?.isPrimaryUser && (
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            You
          </span>
        )}
      </p>
      <p className={`truncate text-[11px] text-white/55 ${textAlignClass} w-full`}>
        {army?.spearheadName ?? '—'}
      </p>
    </div>
  )
}

function RoundRow({
  round,
  onChange,
}: {
  round: MatchRoundScore
  onChange: (
    patch: Partial<Pick<MatchRoundScore, 'playerOnePoints' | 'playerTwoPoints'>>
  ) => void
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2">
      <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/55">
        Ronda {round.roundNumber}
      </span>
      <Stepper
        value={round.playerOnePoints}
        onChange={(v) => onChange({ playerOnePoints: v })}
      />
      <Stepper
        value={round.playerTwoPoints}
        onChange={(v) => onChange({ playerTwoPoints: v })}
      />
    </li>
  )
}

function Stepper({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-lg bg-[#0f1d36] px-1.5 py-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Restar punto"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-base font-bold text-white hover:bg-white/14 disabled:opacity-30"
        disabled={value <= 0}
      >
        –
      </button>
      <span className="min-w-[2ch] text-center text-base font-bold tabular-nums text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Sumar punto"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-base font-bold text-white hover:bg-white/14"
      >
        +
      </button>
    </div>
  )
}

function QuickRulesCard({
  army,
  playerName,
  onOpen,
}: {
  army: Army | undefined
  playerName: string
  onOpen: (src: string, alt: string) => void
}) {
  const src = army?.quickRulesImageName
    ? `/data/QuickRules/${army.quickRulesImageName}`
    : null
  const alt = army
    ? `Quick rules for ${army.spearheadName}`
    : 'Quick rules'

  if (!src) {
    return (
      <div className="rounded-2xl bg-white/4 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">
          {playerName}
        </p>
        <p className="mt-2 text-xs text-white/65">
          Sin Quick Rules para {army?.spearheadName ?? 'este ejército'}.
        </p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(src, alt)}
      className="overflow-hidden rounded-2xl bg-white/8 text-left active:bg-white/12"
    >
      <div className="px-3 pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">
          {playerName}
        </p>
        <p className="truncate text-xs font-semibold text-white">
          {army?.spearheadName}
        </p>
      </div>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="mt-2 w-full object-contain"
      />
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-white/65">
        <ZoomInIcon size={12} />
        Tap para hacer zoom
      </div>
    </button>
  )
}
