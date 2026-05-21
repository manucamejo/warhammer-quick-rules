import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
) as { version: string }

function resolveVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION
  const [major, minor] = pkg.version.split('.')
  try {
    const count = execSync('git rev-list --count HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const sha = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return `${major}.${minor}.${count}+${sha}`
  } catch {
    return pkg.version
  }
}

const APP_VERSION = resolveVersion()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Warhammer Quick Rules',
        short_name: 'WH Quick Rules',
        description: 'Spearhead quick rules and match tracker',
        theme_color: '#451017',
        background_color: '#451017',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,webmanifest}',
          'data/**/*.{json,jpg,png}',
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/data\/data-version\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'data-version',
              expiration: { maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /\/data\/armies\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'armies-json' },
          },
        ],
      },
    }),
  ],
})
