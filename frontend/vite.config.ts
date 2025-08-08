// 📁 frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // 🔧 Configuración específica para React 18
      jsxRuntime: 'automatic',
    })
  ],
  
  // 🔧 Optimizaciones para evitar conflictos DOM
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'framer-motion',
      'react-router-dom'
    ],
    exclude: ['@vitejs/plugin-react']
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    
    // 🔧 Configuración específica para evitar conflictos
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion': ['framer-motion'],
          'router': ['react-router-dom']
        }
      }
    },
    
    // 🔧 Aumentar límite de chunk size
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 3001,
    host: true,
  },
  
  preview: {
    port: 3001,
    host: true
  },
  
  // 🔧 Resolver aliases para evitar conflictos
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // 🔧 Variables de entorno
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
})