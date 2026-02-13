import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    // PWA disabled during development to prevent caching issues
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   injectRegister: 'auto',
    //   devOptions: {
    //     enabled: true,
    //     type: 'module'
    //   },
    //   workbox: {
    //     cleanupOutdatedCaches: true,
    //     skipWaiting: true,
    //     clientsClaim: true
    //   },
    //   manifest: {
    //     name: 'Voice Journal PWA',
    //     short_name: 'Voice Journal',
    //     description: 'Record and organize voice snippets offline',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/icon-192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icon-512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ],
})
