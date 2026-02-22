import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    rollupOptions: {
      external: [],
    },
  },
  
  publicDir: 'public',
  
  server: {
    /**  Allow the dev server to listen on all interfaces
     *   (or set a specific IP/hostname you prefer)           */
    host: '0.0.0.0',

    /**  Explicitly whitelist the external hostname(s) you'll use */
    allowedHosts: [
      'hciproject.henryp.net'
    ],

    /**  Proxy API requests to backend server during development */
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
