import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve index.html for all routes on refresh (SPA fallback)
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor libs into separate cached chunks so the browser can
        // load them in parallel and cache them independently from app code.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-hot-toast')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'http-vendor';
          }
        },
      },
    },
    // Warn when a chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
  },
})
