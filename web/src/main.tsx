import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

registerSW({
  onNeedRefresh() {
    // TODO: wire up an in-app toast in fase 7
    console.info('[PWA] Nueva versión disponible')
  },
  onOfflineReady() {
    console.info('[PWA] App lista para uso offline')
  },
})
