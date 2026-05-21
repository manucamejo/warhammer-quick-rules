import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  applyUpdate,
  checkForUpdates,
  subscribeToUpdates,
} from './updateChecker'

export function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const location = useLocation()

  useEffect(() => subscribeToUpdates(setNeedsRefresh), [])

  useEffect(() => {
    checkForUpdates()
  }, [location.pathname])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdates()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (needsRefresh) applyUpdate()
  }, [needsRefresh])

  return { needsRefresh, applyUpdate }
}
