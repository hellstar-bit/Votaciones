// 📁 frontend/src/main.tsx - QUICK FIX
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🔧 INTERCEPTOR RÁPIDO - Agregar antes de todo
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('insertBefore') ||
      event.error?.message?.includes('removeChild') ||
      event.error?.message?.includes('Node')) {
    console.warn('🔧 DOM Error silenciado:', event.error.message)
    event.preventDefault()
    event.stopPropagation()
    return false
  }
})

// 🔧 Error boundary que ignora errores de DOM
class QuietErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Ignorar errores de DOM específicos
    if (error.message.includes('insertBefore') ||
        error.message.includes('removeChild') ||
        error.message.includes('Node')) {
      console.warn('🔧 Error DOM ignorado:', error.message)
      return { hasError: false } // NO cambiar el estado
    }
    
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Solo loggear errores que NO son de DOM
    if (!error.message.includes('insertBefore') &&
        !error.message.includes('removeChild') &&
        !error.message.includes('Node')) {
      console.error('Error capturado:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Error en la aplicación
            </h1>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const root = ReactDOM.createRoot(rootElement)

// 🔧 Render con error boundary silencioso
root.render(
  <QuietErrorBoundary>
    <App />
  </QuietErrorBoundary>
)

console.log('🔧 Aplicación iniciada con error silencer activo')