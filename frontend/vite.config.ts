// 📁 frontend/vite.config.ts - CONFIGURACIÓN CORREGIDA PARA EVITAR insertBefore ERROR
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      // 🔧 CRÍTICO: Deshabilitar fast refresh en producción
      // 🔧 Configuración babel específica para React Router v7
      babel: {
        plugins: process.env.NODE_ENV === 'production' 
          ? [['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]]
          : []
      }
    })
  ],
  
  // 🔧 Optimización crítica para React Router v7
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'zustand',
      'react-hot-toast'
    ],
    // 🔧 CRÍTICO: Excluir framer-motion en build para evitar conflictos
    exclude: process.env.NODE_ENV === 'production' 
      ? ['framer-motion'] 
      : []
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    
    // 🔧 CONFIGURACIÓN ESPECÍFICA PARA EVITAR insertBefore
    rollupOptions: {
      output: {
        // 🔧 Separar chunks de manera más granular
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'], 
          'state-management': ['zustand'],
          'ui-components': ['@heroicons/react'],
          'notifications': ['react-hot-toast'],
          'utils': ['axios', 'date-fns']
        },
        // 🔧 Formato específico para evitar problemas
        format: 'es',
        // 🔧 Configuración de chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
      // 🔧 Configuración de input específica
      input: {
        main: './index.html'
      }
    },
    
    // 🔧 Configuración específica para el target
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
    
    // 🔧 Configuración de minificación
    minify: 'esbuild',
    cssMinify: true,
    
    chunkSizeWarningLimit: 1000,
    
    // 🔧 CRÍTICO: AssetsInlineLimit para evitar problemas de inserción
    assetsInlineLimit: 0 // No inline assets para evitar problemas DOM
  },
  
  server: {
    port: 3001,
    host: true,
    // 🔧 HMR configuración específica para React Router v7
    hmr: {
      overlay: false // Deshabilitar overlay que puede causar problemas
    }
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
  
  // 🔧 CRÍTICO: Variables de entorno específicas
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    // 🔧 CRUCIAL: Variable para detectar entorno de producción
    '__PROD__': JSON.stringify(process.env.NODE_ENV === 'production')
  },

  // 🔧 Configuración CSS específica
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ]
    },
    // 🔧 NO usar CSS modules que pueden causar problemas
    modules: false
  },

  // 🔧 Configuración de esbuild específica
  esbuild: {
    // 🔧 Drop console en producción
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 🔧 Target específico para mejor compatibilidad
    target: 'es2020'
  }
})