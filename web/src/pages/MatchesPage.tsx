import { AppVersion } from '../components/AppVersion'

export function MatchesPage() {
  return (
    <div
      className="mx-auto max-w-2xl px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Matches</h1>
        <div className="mt-0.5">
          <AppVersion />
        </div>
      </header>
      <p className="text-white/70">Próximamente.</p>
    </div>
  )
}
