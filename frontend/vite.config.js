import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: {
      host: env.FRONTEND_HOST || '127.0.0.1',
      port: Number(env.FRONTEND_PORT || 5173),
      proxy: {
        '/health': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/stats': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/videos': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/folders': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/query': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/store-transcript': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/upload-video': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
        '/media': env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
      },
    },
  }
})
