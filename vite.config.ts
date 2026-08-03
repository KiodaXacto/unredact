import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
    manifest: {
      name: 'Unredact',
      short_name: 'Unredact',
      description: 'Daily Wikipedia word puzzle — uncover the hidden article.',
      theme_color: '#1A1A1A',
      background_color: '#1A1A1A',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      // App shell — cache first
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          // Today's puzzle — stale while revalidate (fast load + background update)
          urlPattern: /\/data\/puzzles\/\d{4}-\d{2}-\d{2}\.json$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'puzzle-cache',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
          },
        },
        {
          // Archive index — network first (needs to be fresh)
          urlPattern: /\/data\/archive-index\.json$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'archive-index-cache',
            networkTimeoutSeconds: 5,
          },
        },
        {
          // Archive puzzle JSONs — cache on demand
          urlPattern: /\/data\/puzzles\/[a-z0-9-]+\.json$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'archive-puzzle-cache',
            networkTimeoutSeconds: 5,
          },
        },
        {
          // Google Fonts — cache first, long TTL
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
      ],
    },
  }), cloudflare()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@features': resolve(__dirname, 'src/features'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@data': resolve(__dirname, 'src/data'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },

  build: {
    target: 'esnext',
    // Split vendor code for better caching
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          return undefined;
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/test/**', '**/*.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});