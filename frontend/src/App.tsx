// 📁 frontend/src/App.tsx - SIN RUTA /dashboard QUE CAUSA PROBLEMAS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Public Pages
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'

// Admin Pages  

// ✅ PROTECTED ROUTE ULTRA SIMPLE
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: string[] 
}) => {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated)
  console.log('🛡️ ProtectedRoute - user:', user)

  if (!isAuthenticated || !user) {
    console.log('❌ No autenticado, redirigiendo a login')
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    console.log('❌ Rol no autorizado')
    return <Navigate to="/unauthorized" replace />
  }

  console.log('✅ Acceso autorizado')
  return children as React.ReactElement
}

// ✅ PLACEHOLDER SIMPLE
const Unauthorized = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-gray-600 mb-4">No tienes permisos para esta sección</p>
      <button
        onClick={() => useAuthStore.getState().logout()}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Volver al Login
      </button>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ✅ RUTAS BÁSICAS */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ✅ RUTA ADMIN DIRECTA (sin pasar por /dashboard) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <div style={{ padding: '20px', background: '#f0f0f0' }}>
                <h1>🎯 TEST - ADMIN ROUTE</h1>
                <p>Si ves esto, ProtectedRoute funciona</p>
                <p>El error está en AdminDashboardPage</p>
              </div>
            </ProtectedRoute>
          } />

          {/* ✅ CATCH ALL */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* ✅ TOASTER SIMPLE */}
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App