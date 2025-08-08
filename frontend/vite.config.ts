import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // 🔧 Configuración para evitar problemas de hidratación
      babel: {
        plugins: [
          // Evitar problemas con keys en desarrollo vs producción
          ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]
        ]
      }
    })
  ],
  
  // 🔧 Configuración específica para producción
  build: {
    rollupOptions: {
      output: {
        // Evitar chunks muy grandes que pueden causar problemas de hidratación
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@headlessui/react', '@heroicons/react']
        }
      }
    },
    // 🔧 Optimizaciones para estabilidad
    minify: 'terser',
   
  },
  
  // 🔧 Configuración de desarrollo que coincida con producción
  server: {
    strictPort: true,
    hmr: {
      overlay: true
    }
  },
  
  // 🔧 Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion'
    ],
    exclude: [
      // Excluir módulos que pueden causar problemas de hidratación
    ]
  },
  
  // 🔧 Definir variables de entorno
  define: {
    // Asegurar que el entorno esté bien definido
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})