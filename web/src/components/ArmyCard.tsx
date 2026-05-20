import { Link } from 'react-router-dom'
import type { Army } from '../types'
import {
  CheckCircleFilledIcon,
  CheckCircleIcon,
  PinFilledIcon,
  PinIcon,
} from './Icons'

interface Props {
  army: Army
  isFavorite: boolean
  isOwned: boolean
  onToggleFavorite: () => void
  onToggleOwned: () => void
}

export function ArmyCard({
  army,
  isFavorite,
  isOwned,
  onToggleFavorite,
  onToggleOwned,
}: Props) {
  const thumbSrc = army.thumbnailImageName
    ? `/data/ArmyThumbnails/${army.thumbnailImageName}`
    : null

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#1a2b4a] shadow-lg shadow-black/30">
      <Link
        to={`/armies/${encodeURIComponent(army.id)}`}
        className="block transition-opacity active:opacity-80"
      >
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-red-900/60 to-orange-700/40">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={army.spearheadName}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">
              No image
            </div>
          )}
        </div>

        <div className="px-4 pb-3 pt-3">
          <div className="flex items-start gap-2">
            <h2 className="flex-1 text-base font-semibold leading-tight text-white">
              {army.spearheadName}
            </h2>
            <div className="flex shrink-0 items-center gap-1">
              {isFavorite && (
                <PinFilledIcon size={16} className="text-amber-400" />
              )}
              {isOwned && (
                <CheckCircleFilledIcon size={16} className="text-green-400" />
              )}
            </div>
          </div>

          <p className="mt-1 text-sm text-white/75">{army.faction}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tag>{army.grandAlliance}</Tag>
            {army.pointsValue != null && <Tag>{army.pointsValue} pts</Tag>}
            {army.modelCount != null && <Tag>{army.modelCount} models</Tag>}
          </div>
        </div>
      </Link>

      <div className="flex gap-2 px-4 pb-4">
        <ActionButton
          active={isFavorite}
          onClick={onToggleFavorite}
          activeColor="amber"
        >
          {isFavorite ? (
            <PinFilledIcon size={16} />
          ) : (
            <PinIcon size={16} />
          )}
          <span>{isFavorite ? 'Unpin' : 'Pin'}</span>
        </ActionButton>

        <ActionButton
          active={isOwned}
          onClick={onToggleOwned}
          activeColor="green"
        >
          {isOwned ? (
            <CheckCircleFilledIcon size={16} />
          ) : (
            <CheckCircleIcon size={16} />
          )}
          <span>{isOwned ? 'Owned' : 'Mark owned'}</span>
        </ActionButton>
      </div>
    </article>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/14 px-2.5 py-1 text-xs font-semibold text-white">
      {children}
    </span>
  )
}

function ActionButton({
  active,
  activeColor,
  onClick,
  children,
}: {
  active: boolean
  activeColor: 'amber' | 'green'
  onClick: () => void
  children: React.ReactNode
}) {
  const activeClass =
    activeColor === 'amber'
      ? 'bg-amber-500/20 text-amber-300'
      : 'bg-green-500/20 text-green-300'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
        active ? activeClass : 'bg-white/8 text-white/80 hover:bg-white/12'
      }`}
    >
      {children}
    </button>
  )
}
