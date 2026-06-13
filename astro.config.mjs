// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://nooblogaurus.online',
  redirects: {
    '/articles/cve-2026-35167-kedro-path-traversal': '/articles/cve-2026-3840-kedro-path-traversal'
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
