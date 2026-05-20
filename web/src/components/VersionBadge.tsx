import { useAppUpdate } from '../lib/useAppUpdate'

const VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev'

export function VersionBadge() {
  const { needsRefresh, applyUpdate } = useAppUpdate()

  if (needsRefresh) {
    return (
      <button
        type="button"
        onClick={applyUpdate}
        className="fixed bottom-[4.5rem] right-3 z-20 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-black/30 active:bg-amber-400"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        Nueva versión · tap para actualizar
      </button>
    )
  }

  return (
    <span
      className="fixed bottom-[4.5rem] right-3 z-10 select-none rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-white/45"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="App version"
    >
      v{VERSION}
    </span>
  )
}
