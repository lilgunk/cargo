import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production build goes to dist/ — Cloudflare Pages builds it on every push to main
// and serves index.html for app paths (/login, /app, …) by itself.
export default defineConfig({
  plugins: [react()],
})
