// 📁 frontend/vite.config.ts - CONFIGURACIÓN SIMPLIFICADA Y SEGURA
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
  
  // 🔧 Optimización básica
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'zustand',
      'react-hot-toast'
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    
    // 🔧 Configuración básica para evitar problemas
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'] 
        }
      }
    },
    
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 0
  },
  
  server: {
    port: 3001,
    host: true
  },
  
  preview: {
    port: 3001,
    host: true
  },
  
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // 🔧 Variables de entorno básicas
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },

  // 🔧 CSS simple
  css: {
    modules: false
  }
})