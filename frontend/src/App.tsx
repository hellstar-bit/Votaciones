import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Pages
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import VotingStation from './components/voting/VotingStation'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminVotingPage from './pages/admin/AdminVotingPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'


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

// Placeholder components for other dashboards
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
      return <Navigate to="/admin" replace />        // ← Va al dashboard con sidebar
    case 'MESA_VOTACION':
      return <Navigate to="/voting" replace />       // ← Va directo a votación sin sidebar
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

          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } />

          {/* Voting Station Route (para usuarios MESA_VOTACION) */}
          <Route path="/voting" element={
            <ProtectedRoute allowedRoles={['MESA_VOTACION', 'ADMIN']}>
              <VotingStation />
            </ProtectedRoute>
          } />

          {/* Legacy routes - mantener por compatibilidad */}
          <Route path="/voting-legacy" element={
            <ProtectedRoute allowedRoles={['MESA_VOTACION']}>
              <VotingDashboard />
            </ProtectedRoute>
          } />

          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
              <InstructorDashboard />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App