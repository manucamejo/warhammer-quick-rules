import { registerSW } from 'virtual:pwa-register'

type Subscriber = (needsRefresh: boolean) => void

let swRegistration: ServiceWorkerRegistration | undefined
let needsRefreshState = false
const subscribers = new Set<Subscriber>()

const updateSW = registerSW({
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration
  },
  onNeedRefresh() {
    needsRefreshState = true
    subscribers.forEach((fn) => fn(true))
  },
  onOfflineReady() {
    console.info('[PWA] offline ready')
  },
})

export function checkForUpdates(): void {
  void swRegistration?.update()
}

export function applyUpdate(): void {
  void updateSW(true)
}

export function subscribeToUpdates(fn: Subscriber): () => void {
  subscribers.add(fn)
  fn(needsRefreshState)
  return () => {
    subscribers.delete(fn)
  }
}
