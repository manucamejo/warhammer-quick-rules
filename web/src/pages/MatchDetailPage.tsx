import { Link, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/Icons'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div
      className="mx-auto max-w-2xl px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <Link
        to="/matches"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-white/75 hover:text-white"
      >
        <ChevronLeftIcon size={16} /> Matches
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Partida</h1>
      <p className="mt-2 text-sm text-white/60">ID: {id}</p>
      <p className="mt-4 text-white/70">Detalle próximamente.</p>
    </div>
  )
}
