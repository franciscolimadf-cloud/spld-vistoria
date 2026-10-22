import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [],

      manifest: {
        name: 'SPLD Vistoria',
        short_name: 'SPLD',

        description:
          'Aplicação para realização de vistorias SPLD em empresas de transporte de valores.',

        theme_color: '#172033',
        background_color: '#f3f5f8',

        display: 'standalone',

        start_url: '/',

        icons: [],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}',
        ],
      },
    }),
  ],
});