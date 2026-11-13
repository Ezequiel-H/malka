/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cropped-favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Malka',
        short_name: 'Malka',
        description: 'Actividades del centro cultural Malka',
        lang: 'es',
        /* La raíz es la landing pública. Quien se instaló la app quiere
           abrir la app, no la vitrina. */
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#f9f2e8',
        theme_color: '#f9f2e8',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // La API y los comprobantes nunca deben caer en el fallback de SPA
        // ni quedar cacheados por el precache.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        // Manejo de notificaciones push (mostrar y abrir al tocar).
        importScripts: ['push-sw.js']
      }
    })
  ],
  // Rutas del cliente (/dashboard, /admin/...) no son archivos: el servidor debe devolver index.html
  appType: 'spa',
  build: {
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**', '**/node_modules/**']
  }
});

