import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/spld-vistoria/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'spld-icon.svg',
      ],

      manifest: {
        id: '/spld-vistoria/',

        name: 'SPLD Vistoria',
        short_name: 'SPLD',

        description:
          'Aplicação para realização de vistorias SPLD em empresas de transporte de valores.',

        lang: 'pt-BR',

        theme_color: '#172033',
        background_color: '#f3f5f8',

        display: 'standalone',

        orientation: 'portrait-primary',

        scope: '/spld-vistoria/',
        start_url: '/spld-vistoria/',

        icons: [
          {
            src: '/spld-vistoria/spld-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/spld-vistoria/spld-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}',
        ],
      },
    }),
  ],
});
