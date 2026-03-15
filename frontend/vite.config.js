import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  /**
   * During local development we proxy API calls from the Vite dev server
   * (http://localhost:5173) to the FastAPI backend (http://localhost:8000).
   *
   * All requests starting with /api will be forwarded, so the frontend can use
   * relative URLs like `/api/v1/projects` without CORS problemas.
   */
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
