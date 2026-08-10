import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // El build de escritorio se carga por file:// dentro de Electron: rutas relativas
  // y sin service worker (no se registran en file://, sólo daría errores en consola).
  const desktop = mode === 'desktop';

  return {
  base: desktop ? './' : '/',
  plugins: [
    react(),
    tailwindcss(),
    !desktop && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Matching — Encuentra tu equipo ideal',
        short_name: 'Matching',
        description: 'Conecta con jugadores que comparten tu juego, rango, rol y estilo de juego.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#7c3aed',
        background_color: '#070b14',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        // Las portadas de juegos pesan varios MB: fuera del precache (instalación ligera),
        // se cachean bajo demanda con la regla de runtime de más abajo.
        globIgnores: ['**/games/*'],
        // La app es una SPA: cualquier navegación cae en index.html…
        navigateFallback: '/index.html',
        // …salvo /api, que debe llegar al backend y nunca servirse desde caché de shell.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Datos del backend: primero red, caché sólo como respaldo sin conexión.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'matching-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Portadas de juegos servidas desde /games (excluidas del precache por tamaño).
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/games/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-covers',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Retratos de campeones, iconos de invocador y objetos de Data Dragon.
            urlPattern: ({ url }) => url.hostname === 'ddragon.leagueoflegends.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'riot-data-dragon',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ].filter(Boolean),
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  };
});
