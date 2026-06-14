import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// On GitHub Pages the app is served from a subpath (e.g. /fat-track/), so the
// deploy workflow sets VITE_BASE. Locally and for tests it stays at root.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'fat-track',
        short_name: 'fat-track',
        description: 'Offline-first calorie logger',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        // Relative values resolve against the manifest URL, so they work whether
        // the app is served from root or a Pages subpath.
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // App shell is precached so the app cold-starts offline from the Home Screen.
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
