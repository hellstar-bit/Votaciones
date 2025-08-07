// 📁 frontend/src/App.tsx - VERSIÓN COMPLETA CON TODAS LAS RUTAS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Public Pages
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminImportPage from './pages/admin/AdminImportPage'           // ✅ NUEVA
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminVotingPage from './pages/admin/AdminVotingPage'

// Dashboard Pages
import RealTimeDashboard from './pages/dashboard/RealTimeDashboard'

// Voting Components
import VotingStation from './components/voting/VotingStation'
import AdminAprendicesPage from './components/admin/AdminAprendicesPage'

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

// Página de placeholder para instructores
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

// Página de acceso no autorizado
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

// Auto-redirect basado en el rol del usuario
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
          {/* ========================================== */}
          {/* RUTAS PÚBLICAS */}
          {/* ========================================== */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ========================================== */}
          {/* AUTO-REDIRECT DASHBOARD */}
          {/* ========================================== */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ========================================== */}
          {/* RUTAS DE ADMINISTRADOR */}
          {/* ========================================== */}
          
          {/* Dashboard principal del admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* Gestión de usuarios del sistema */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />

          {/* ✅ NUEVA: Gestión de aprendices (CRUD completo) */}
          <Route path="/admin/aprendices" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAprendicesPage />
            </ProtectedRoute>
          } />

          {/* ✅ NUEVA: Importación masiva de aprendices desde Excel */}
          <Route path="/admin/import" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminImportPage />
            </ProtectedRoute>
          } />

          {/* Mesa de votación para admin (pruebas) */}
          <Route path="/admin/voting" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVotingPage />
            </ProtectedRoute>
          } />
        
          {/* Reportes y estadísticas */}
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReportsPage />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* RUTAS DE DASHBOARD EN TIEMPO REAL */}
          {/* ========================================== */}
          
          {/* Dashboard en tiempo real (Admin y Dashboard users) */}
          <Route path="/real-time-dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DASHBOARD']}>
              <RealTimeDashboard />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* RUTAS DE VOTACIÓN */}
          {/* ========================================== */}
          
          {/* Mesa de votación (solo usuarios MESA_VOTACION) */}
          <Route path="/voting" element={
            <ProtectedRoute allowedRoles={['MESA_VOTACION']}>
              <VotingStation />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* RUTAS DE INSTRUCTOR */}
          {/* ========================================== */}
          
          {/* Panel de instructor (placeholder por ahora) */}
          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
              <InstructorPlaceholder />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* RUTAS ADICIONALES FUTURAS */}
          {/* ========================================== */}
          
          {/* Aquí puedes agregar más rutas según necesites: */}
          
          {/* Ejemplo: Gestión de elecciones */}
          {/* <Route path="/admin/elections" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminElectionsPage />
            </ProtectedRoute>
          } /> */}

          {/* Ejemplo: Gestión de candidatos */}
          {/* <Route path="/admin/candidates" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminCandidatesPage />
            </ProtectedRoute>
          } /> */}

          {/* Ejemplo: Configuración del sistema */}
          {/* <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } /> */}

          {/* Ejemplo: Auditoría y logs */}
          {/* <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAuditPage />
            </ProtectedRoute>
          } /> */}

          {/* ========================================== */}
          {/* CATCH ALL - REDIRECT */}
          {/* ========================================== */}
          
          {/* Cualquier ruta no encontrada redirige al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* ========================================== */}
        {/* NOTIFICACIONES TOAST GLOBALES */}
        {/* ========================================== */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #374151',
              fontSize: '14px',
            },
            success: {
              style: {
                background: '#065F46',
                color: '#D1FAE5',
                border: '1px solid #10B981',
              },
              iconTheme: {
                primary: '#10B981',
                secondary: '#D1FAE5',
              },
            },
            error: {
              style: {
                background: '#7F1D1D',
                color: '#FEE2E2',
                border: '1px solid #EF4444',
              },
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FEE2E2',
              },
            },
            loading: {
              style: {
                background: '#1E40AF',
                color: '#DBEAFE',
                border: '1px solid #3B82F6',
              },
              iconTheme: {
                primary: '#3B82F6',
                secondary: '#DBEAFE',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App