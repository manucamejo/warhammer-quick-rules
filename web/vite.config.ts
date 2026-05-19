import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
