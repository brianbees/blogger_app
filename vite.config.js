import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  base: '/blogger/', // Set base path for subfolder deployment
  build: {
    sourcemap: true, // Enable sourcemaps for debugging
    minify: 'terser', // Minify for production
  },
  server: {
    host: true, // Expose on network
    https: true,
  },
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Voice Journal',
        short_name: 'Voice Journal',
        description: 'Record and organize voice snippets with cloud sync',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '/blogger/',
        scope: '/blogger/',
        icons: [
          {
            src: '/blogger/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
