import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit to avoid noisy warnings for large bundles
    chunkSizeWarningLimit: 1024, // in KB
  },
})
