import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🔧 Error boundary mejorado para DOM issues
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error boundary caught:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error capturado:', error, errorInfo)
    
    // 🔧 Específico para errores de DOM/insertBefore
    if (error.message.includes('insertBefore') || error.message.includes('removeChild')) {
      console.warn('DOM manipulation error detected - attempting recovery')
      // Force a clean re-render
      setTimeout(() => {
        this.setState({ hasError: false })
      }, 100)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Error en la aplicación
            </h1>
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado. Por favor, recarga la página.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Recargar página
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Detalles del error
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 🔧 Hook para detectar hidratación
const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = React.useState(false)
  
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  return isHydrated
}

// 🔧 Wrapper para evitar problemas de hidratación
const HydrationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isHydrated = useIsHydrated()
  
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return <>{children}</>
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const root = ReactDOM.createRoot(rootElement)

// 🔧 Render con protección contra errores de DOM
root.render(
  <ErrorBoundary>
    <HydrationWrapper>
      <App />
    </HydrationWrapper>
  </ErrorBoundary>
)