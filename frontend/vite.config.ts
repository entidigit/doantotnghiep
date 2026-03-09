import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend URL - mặc định dùng Docker backend
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:9998'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/api':     BACKEND_URL,
      '/verify':  BACKEND_URL,
      '/qr':      BACKEND_URL,
      '/uploads': BACKEND_URL,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
