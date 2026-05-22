import { useEffect, type ReactNode } from 'react'
import { XIcon } from './Icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  fullHeight?: boolean
}

export function Modal({ title, onClose, children, footer, fullHeight }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#1a2b4a] shadow-2xl shadow-black/50 sm:rounded-3xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          ...(fullHeight
            ? { height: 'calc(100dvh - env(safe-area-inset-top) - 1rem)' }
            : { maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 1rem)' }),
        }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/80 hover:bg-white/12"
          >
            <XIcon size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-white/10 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
