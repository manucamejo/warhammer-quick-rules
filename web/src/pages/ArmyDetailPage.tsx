import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircleFilledIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  PinFilledIcon,
  PinIcon,
  ShareIcon,
  ZoomInIcon,
} from '../components/Icons'
import { QuickRulesViewer } from '../components/QuickRulesViewer'
import { useArmiesStore } from '../store/armies'

export function ArmyDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = decodeURIComponent(rawId ?? '')

  const loadArmies = useArmiesStore((s) => s.loadArmies)
  const armies = useArmiesStore((s) => s.armies)
  const isLoading = useArmiesStore((s) => s.isLoading)
  const favoriteIDs = useArmiesStore((s) => s.favoriteIDs)
  const ownedIDs = useArmiesStore((s) => s.ownedIDs)
  const toggleFavorite = useArmiesStore((s) => s.toggleFavorite)
  const toggleOwned = useArmiesStore((s) => s.toggleOwned)

  const army = armies.find((a) => a.id === id)
  const isFavorite = favoriteIDs.includes(id)
  const isOwned = ownedIDs.includes(id)

  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    void loadArmies()
  }, [loadArmies])

  if (!army) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <BackLink />
        <p className="mt-8 text-center text-white/70">
          {isLoading ? 'Cargando ejército…' : 'Ejército no encontrado.'}
        </p>
      </div>
    )
  }

  const heroSrc = army.thumbnailImageName
    ? `/data/ArmyThumbnails/${army.thumbnailImageName}`
    : null
  const quickRulesSrc = army.quickRulesImageName
    ? `/data/QuickRules/${army.quickRulesImageName}`
    : null

  const handleShare = async () => {
    if (!army.officialPDFURL) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: army.spearheadName,
          text: `${army.faction} — ${army.spearheadName}`,
          url: army.officialPDFURL,
        })
      } catch {
        // user dismissed share sheet
      }
    } else {
      await navigator.clipboard.writeText(army.officialPDFURL)
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-4">
      <div
        className="relative w-full bg-gradient-to-br from-red-900/60 to-orange-700/40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative aspect-[1000/428] w-full overflow-hidden">
          {heroSrc && (
            <img
              src={heroSrc}
              alt={army.spearheadName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#451017] to-transparent" />
        </div>
        <Link
          to="/armies"
          aria-label="Volver"
          className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <ChevronLeftIcon size={22} />
        </Link>
      </div>

      <div className="mt-4 space-y-4 px-4">
        <section className="rounded-3xl border border-white/10 bg-[#1a2b4a] p-5 shadow-lg shadow-black/30">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight text-white">
              {army.spearheadName}
            </h1>
            <button
              type="button"
              onClick={() => toggleFavorite(army.id)}
              aria-label={isFavorite ? 'Unpin' : 'Pin'}
              aria-pressed={isFavorite}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-white/10 text-white/75'
              }`}
            >
              {isFavorite ? (
                <PinFilledIcon size={18} />
              ) : (
                <PinIcon size={18} />
              )}
            </button>
          </div>

          <p className="mt-1 text-base text-white/75">{army.faction}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tag>{army.grandAlliance}</Tag>
            {army.pointsValue != null && <Tag>{army.pointsValue} pts</Tag>}
            {army.modelCount != null && <Tag>{army.modelCount} models</Tag>}
          </div>

          <button
            type="button"
            onClick={() => toggleOwned(army.id)}
            className={`mt-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isOwned
                ? 'bg-green-500/20 text-green-300'
                : 'bg-white/10 text-white/80'
            }`}
          >
            {isOwned ? (
              <CheckCircleFilledIcon size={16} />
            ) : (
              <CheckCircleIcon size={16} />
            )}
            <span>{isOwned ? 'Owned' : 'Mark owned'}</span>
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#1a2b4a] p-5 shadow-lg shadow-black/30">
          <h2 className="mb-3 text-lg font-bold text-white">Rules</h2>
          <RulesText details={army.details} />
        </section>

        {army.officialPDFURL && (
          <section className="rounded-3xl border border-white/10 bg-[#1a2b4a] p-5 shadow-lg shadow-black/30">
            <h2 className="mb-3 text-lg font-bold text-white">Official PDF</h2>
            <div className="flex gap-2">
              <a
                href={army.officialPDFURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/8 px-3 py-2.5 text-sm font-semibold text-white active:bg-white/12"
              >
                <ExternalLinkIcon size={16} />
                Open PDF
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/8 px-3 py-2.5 text-sm font-semibold text-white active:bg-white/12"
              >
                <ShareIcon size={16} />
                Share
              </button>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#1a2b4a] p-5 shadow-lg shadow-black/30">
          <h2 className="mb-3 text-lg font-bold text-white">Quick Rules</h2>
          {quickRulesSrc ? (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="block w-full overflow-hidden rounded-2xl bg-white/8 active:bg-white/12"
            >
              <img
                src={quickRulesSrc}
                alt={`Quick rules for ${army.spearheadName}`}
                className="w-full object-contain"
              />
              <div className="flex items-center gap-1.5 p-2 text-xs font-medium text-white/70">
                <ZoomInIcon size={14} />
                Tap para hacer zoom
              </div>
            </button>
          ) : (
            <p className="rounded-2xl bg-white/8 p-4 text-sm text-white/75">
              No hay imagen local de Quick Rules para este ejército todavía.
            </p>
          )}
        </section>
      </div>

      {zoomOpen && quickRulesSrc && (
        <QuickRulesViewer
          src={quickRulesSrc}
          alt={`Quick rules for ${army.spearheadName}`}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/armies"
      aria-label="Volver"
      className="inline-flex items-center gap-1 text-sm font-medium text-white/70"
    >
      <ChevronLeftIcon size={16} />
      Volver
    </Link>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/14 px-2.5 py-1 text-xs font-semibold text-white">
      {children}
    </span>
  )
}

function RulesText({ details }: { details: string }) {
  const lines = details
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const upper = line.toUpperCase()
        if (upper === 'GENERAL' || upper === 'UNITS') {
          return (
            <h3
              key={i}
              className="pt-2 text-sm font-bold uppercase tracking-wider text-white underline underline-offset-4"
            >
              {upper}
            </h3>
          )
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-white/90">
            {line}
          </p>
        )
      })}
    </div>
  )
}
