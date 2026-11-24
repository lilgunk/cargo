import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves 404.html for unknown paths. A copy of index.html lets the
// React router handle direct links and page refreshes (e.g. /login, /admin).
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(resolve('docs/index.html'), resolve('docs/404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
  base: '/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
