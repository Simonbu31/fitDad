import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// GitHub Pages needs the app served under /fitDad/; the native iOS/Android
// shell (via Capacitor) serves everything from its own root, so it needs
// base '/'. Toggle with `CAPACITOR_BUILD=1 npm run build`.
export default defineConfig({
  base: process.env.CAPACITOR_BUILD ? '/' : '/fitDad/',
  plugins: [react(), tailwindcss()],
})
