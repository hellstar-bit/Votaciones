// 📁 frontend/vite.config.ts - CONFIGURACIÓN SIMPLIFICADA CON STUB
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
  
  resolve: {
    alias: {
      '@': '/src',
      // 🔥 CRÍTICO: Reemplazar Framer Motion con stub
      'framer-motion': '/src/utils/framer-motion-stub.ts'
    }
  },
  
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
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom']
        }
      }
    },
    
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 3001,
    host: true
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})