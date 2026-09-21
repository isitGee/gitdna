import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes all asset URLs relative, so the same build works on any
// GitHub Pages subpath (https://user.github.io/repo/) or a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
})
