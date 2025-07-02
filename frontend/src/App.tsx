// 📁 frontend/src/App.tsx - CORREGIDO
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminVotingPage from './pages/admin/AdminVotingPage' // ✅ IMPORTAR AdminVotingPage
import VotingStation from './components/voting/VotingStation'
import RealTimeDashboard from './pages/dashboard/RealTimeDashboard'

// Componente de protección de rutas
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: string[] 
}) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Páginas de error y no autorizado
const InstructorPlaceholder = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-sena-600 mb-4">Panel de Instructor</h1>
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
    case 'DASHBOARD':
      return <Navigate to="/real-time-dashboard" replace />
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

          {/* Auto-redirect Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* ✅ NUEVA RUTA: Mesa de Votación para Admin */}
          <Route path="/admin/voting" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVotingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReportsPage />
            </ProtectedRoute>
          } />

          {/* Dashboard en Tiempo Real */}
          <Route path="/real-time-dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DASHBOARD']}>
              <RealTimeDashboard />
            </ProtectedRoute>
          } />

          {/* Voting Station - Solo para usuarios MESA_VOTACION */}
          <Route path="/voting" element={
            <ProtectedRoute allowedRoles={['MESA_VOTACION']}>
              <VotingStation />
            </ProtectedRoute>
          } />

          {/* Instructor Routes */}
          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
              <InstructorPlaceholder />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #374151',
            },
            success: {
              style: {
                background: '#065F46',
                color: '#D1FAE5',
                border: '1px solid #10B981',
              },
            },
            error: {
              style: {
                background: '#7F1D1D',
                color: '#FEE2E2',
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