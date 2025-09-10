import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 🔑 ESTA LÍNEA ES CRUCIAL - carga las variables del .env
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔍 Puerto desde .env:', env.VITE_PORT)
  console.log('🔍 Modo actual:', mode)
  console.log('🔍 API URL:', env.VITE_API_URL)
  
  return {
    plugins: [react()],
    base: '/sena-votaciones/', // 👈 Asegúrate de que coincide con el "basename" en App.tsx
    server: {
      port: parseInt(env.VITE_PORT || '5173'), // 👈 env.VITE_PORT (no process.env)
      host: true,
      open: true,
      // 🆕 CORS PROXY PARA DESARROLLO
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('📡 Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📨 Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    },
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT || '4173'), // 👈 env.VITE_PREVIEW_PORT
    }
  }
})