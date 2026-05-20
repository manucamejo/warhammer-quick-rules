import { useAppUpdate } from '../lib/useAppUpdate'

const VERSION = __APP_VERSION__

export function AppVersion() {
  const { needsRefresh, applyUpdate } = useAppUpdate()

  if (needsRefresh) {
    return (
      <button
        type="button"
        onClick={applyUpdate}
        className="block text-xs font-medium text-amber-300 underline underline-offset-2"
      >
        v{VERSION} · tap para actualizar
      </button>
    )
  }

  return (
    <span className="block text-xs font-medium text-white/40 select-none">
      v{VERSION}
    </span>
  )
}
