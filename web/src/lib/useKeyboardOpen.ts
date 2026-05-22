import { useEffect, useState } from 'react'

export function useKeyboardOpen(threshold = 100): boolean {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handler = () => {
      const diff = window.innerHeight - vv.height
      setIsOpen(diff > threshold)
    }
    handler()

    vv.addEventListener('resize', handler)
    vv.addEventListener('scroll', handler)
    return () => {
      vv.removeEventListener('resize', handler)
      vv.removeEventListener('scroll', handler)
    }
  }, [threshold])

  return isOpen
}
