import { useAppUpdate } from '../lib/useAppUpdate'

const VERSION = __APP_VERSION__

export function AppVersion() {
  useAppUpdate()

  return (
    <span className="block text-xs font-medium text-white/40 select-none">
      v{VERSION}
    </span>
  )
}
