import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves 404.html for unknown paths. A copy of index.html lets the
// React router handle direct links and page refreshes (e.g. /login, /admin).
function spaFallback(): Plugin {
  let outDir = 'docs'
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      // Cloudflare Pages serves index.html for unknown paths by itself (SPA mode) —
      // but only when there is no 404.html, so the copy is made for GitHub Pages only.
      if (process.env.CF_PAGES) return
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
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
