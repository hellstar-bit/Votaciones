// 📁 frontend/vite.config.ts
// ====================================================================
// 🔧 CONFIGURACIÓN DE VITE PARA SPA Y VERCEL
// ====================================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // 🔧 Configuración para SPA
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Desactivar en producción para mejorar rendimiento
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@heroicons/react']
        }
      }
    }
  },
  
  // 🔧 Optimizaciones
  optimizeDeps: {
    include: ['framer-motion', 'react-router-dom']
  },
  
  // 🔧 Configuración del servidor de desarrollo
  server: {
    port: 3001,
    host: true,
  },
  
  // 🔧 Preview server (para testing local)
  preview: {
    port: 3001,
    host: true,
  },
  
  // 🔧 Base URL (ajustar si despliegas en subdirectorio)
  base: '/',
  
  // 🔧 Variables de entorno
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})