import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3004,
    host: true,
    allowedHosts: ['vibe.vibevalidator.com', 'localhost']
  },
  server: {
    port: 5173,
    host: true
  }
})
