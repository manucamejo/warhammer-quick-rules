import { useEffect } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { XIcon } from './Icons'

interface Props {
  src: string
  alt: string
  onClose: () => void
}

export function QuickRulesViewer({ src, alt, onClose }: Props) {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <XIcon size={20} />
      </button>
      <TransformWrapper
        minScale={1}
        maxScale={6}
        initialScale={1}
        doubleClick={{ mode: 'toggle', step: 2 }}
        wheel={{ step: 0.2 }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full select-none"
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
