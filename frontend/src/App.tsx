import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Pages
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return <>{children}</>
}

// Placeholder components for different dashboards
const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Administrativo</h1>
      <p className="text-gray-600 mb-6">Bienvenido al panel de administración</p>
      <button 
        onClick={() => useAuthStore.getState().logout()}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  </div>
)

const VotingDashboard = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Mesa de Votación</h1>
      <p className="text-gray-600 mb-6">Sistema de votación activo</p>
      <button 
        onClick={() => useAuthStore.getState().logout()}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  </div>
)

const InstructorDashboard = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Instructor</h1>
      <p className="text-gray-600 mb-6">Panel de control para instructores</p>
      <button 
        onClick={() => useAuthStore.getState().logout()}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  </div>
)

const Unauthorized = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta sección</p>
      <button 
        onClick={() => useAuthStore.getState().logout()}
        className="bg-sena-500 text-white px-4 py-2 rounded-lg hover:bg-sena-600"
      >
        Volver al Login
      </button>
    </div>
  </div>
)

// Auto-redirect based on user role
const Dashboard = () => {
  const { user } = useAuthStore()
  
  if (!user) return <Navigate to="/login" replace />
  
  switch (user.rol) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />
    case 'MESA_VOTACION':
      return <Navigate to="/voting" replace />
    case 'INSTRUCTOR':
      return <Navigate to="/instructor" replace />
    default:
      return <Navigate to="/unauthorized" replace />
  }
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Auto-redirect route */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/voting" 
            element={
              <ProtectedRoute allowedRoles={['MESA_VOTACION', 'ADMIN']}>
                <VotingDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/instructor" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
            },
            success: {
              style: {
                border: '1px solid #10B981',
              },
            },
            error: {
              style: {
                border: '1px solid #EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App