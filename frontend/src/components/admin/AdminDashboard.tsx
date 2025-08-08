// 📁 frontend/src/components/admin/AdminDashboard.tsx - SOLUCIÓN PARA REACT ROUTER V7
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  PlayIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { dashboardApi, electionsApi, type Election, type DashboardStats, handleApiError } from '../../services/api'

// Lazy loading para evitar problemas de inserción


// Loading Fallback simplificado
const LoadingFallback = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
)

// Componente principal simplificado para evitar conflictos DOM
const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Estados principales
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'candidates' | 'settings'>('dashboard')
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null)

  // Estados para componentes lazy
  const [CreateModal, setCreateModal] = useState<any>(null)
  const [CandidatesComp, setCandidatesComp] = useState<any>(null)
  const [SettingsComp, setSettingsComp] = useState<any>(null)

  // Cargar componentes lazy
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const [createModal, candidates, settings] = await Promise.all([
          import('../modals/CreateElectionModal').then(m => m.default),
          import('../candidates/CandidatesManagement').then(m => m.default),
          import('../candidates/ElectionSettings').then(m => m.default)
        ])
        
        setCreateModal(() => createModal)
        setCandidatesComp(() => candidates)
        setSettingsComp(() => settings)
      } catch (error) {
        console.error('Error loading components:', error)
      }
    }
    
    loadComponents()
  }, [])

  // Cargar datos iniciales
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashboardStats, allElections] = await Promise.all([
        dashboardApi.getStats(),
        electionsApi.getAll()
      ])
      setStats(dashboardStats)
      setElections(allElections)
    } catch (error) {
      const errorMessage = handleApiError(error, 'cargando datos')
      toast.error(`Error cargando datos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(async () => {
      try {
        const [dashboardStats, allElections] = await Promise.all([
          dashboardApi.getStats(),
          electionsApi.getAll()
        ])
        setStats(dashboardStats)
        setElections(allElections)
      } catch (error) {
        console.error('Error actualizando datos:', error)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Handlers memoizados
  const handleActivateElection = useCallback(async (electionId: number) => {
    try {
      await electionsApi.activate(electionId)
      toast.success('Elección activada exitosamente')
      await fetchDashboardData()
    } catch (error) {
      const errorMessage = handleApiError(error, 'activando elección')
      toast.error(`Error activando elección: ${errorMessage}`)
    }
  }, [fetchDashboardData])

  const handleFinalizeElection = useCallback(async (electionId: number) => {
    try {
      await electionsApi.finalize(electionId)
      toast.success('Elección finalizada exitosamente')
      await fetchDashboardData()
    } catch (error) {
      const errorMessage = handleApiError(error, 'finalizando elección')
      toast.error(`Error finalizando elección: ${errorMessage}`)
    }
  }, [fetchDashboardData])

  const handleElectionCreated = useCallback(async () => {
    await fetchDashboardData()
    toast.success('Los datos se han actualizado')
  }, [fetchDashboardData])

  const handleViewCandidates = useCallback((electionId: number) => {
    setSelectedElectionId(electionId)
    setCurrentView('candidates')
  }, [])

  const handleElectionSettings = useCallback((electionId: number) => {
    setSelectedElectionId(electionId)
    setCurrentView('settings')
  }, [])

  const handleBackToDashboard = useCallback(() => {
    setCurrentView('dashboard')
    setSelectedElectionId(null)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    // Usar replace para evitar problemas de navegación
    navigate('/login', { replace: true })
  }, [logout, navigate])

  // Funciones para estilos
  const getStatusColor = useCallback((estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800'
      case 'configuracion': return 'bg-yellow-100 text-yellow-800'
      case 'finalizada': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getStatusIcon = useCallback((estado: string) => {
    switch (estado) {
      case 'activa': return <PlayIcon className="w-4 h-4" />
      case 'configuracion': return <Cog6ToothIcon className="w-4 h-4" />
      case 'finalizada': return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelada': return <ExclamationTriangleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }, [])

  // Stats memoizadas
  const safeStats = useMemo(() => ({
    summary: {
      total_elections: stats?.total_elections || 0,
      active_elections: stats?.active_elections || 0,
      total_votes: stats?.total_votes || 0,
      total_voters: stats?.total_voters || 0,
      participation_rate: stats?.participation_rate || 0,
    },
    recent_activity: stats?.recent_activity || []
  }), [stats])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingFallback />
          <p className="text-gray-600 font-medium mt-4">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Renderizado condicional para evitar conflictos de inserción
  if (currentView === 'candidates' && selectedElectionId && CandidatesComp) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CandidatesComp
          electionId={selectedElectionId}
          onBack={handleBackToDashboard}
        />
      </Suspense>
    )
  }

  if (currentView === 'settings' && selectedElectionId && SettingsComp) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SettingsComp
          electionId={selectedElectionId}
          onBack={handleBackToDashboard}
        />
      </Suspense>
    )
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel Administrativo</h1>
                <p className="text-sm text-gray-500">Sistema de Votaciones SENA</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Búsqueda */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar elecciones..." 
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
                />
                <ChartBarIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Notificaciones */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Dashboard tiempo real */}
              <button
                onClick={() => navigate('/dashboard/real-time', { replace: true })}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Dashboard Tiempo Real</span>
              </button>

              {/* Usuario */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombre_completo || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.rol || 'Admin'}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-500 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium">Total Elecciones</p>
                  <p className="text-2xl font-bold mt-1">{safeStats.summary.total_elections}</p>
                  <p className="text-green-200 text-xs mt-1">En el sistema</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-green-600 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium">Elecciones Activas</p>
                  <p className="text-2xl font-bold mt-1">{safeStats.summary.active_elections}</p>
                  <p className="text-green-200 text-xs mt-1">En proceso</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <PlayIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-green-500 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium">Total Votos</p>
                  <p className="text-2xl font-bold mt-1">{safeStats.summary.total_votes}</p>
                  <p className="text-green-200 text-xs mt-1">Registrados</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-green-700 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium">Participación</p>
                  <p className="text-2xl font-bold mt-1">{safeStats.summary.participation_rate.toFixed(1)}%</p>
                  <p className="text-green-200 text-xs mt-1">Promedio</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ChartPieIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
            {/* Elections List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Elecciones</h3>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Nueva Elección</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {elections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No hay elecciones disponibles</h4>
                      <p className="text-gray-500 text-sm mb-6">Comienza creando tu primera elección para el sistema</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Crear Primera Elección
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {elections.map((election) => (
                        <div 
                          key={election.id_eleccion}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-base font-medium text-gray-900">{election.titulo}</h4>
                                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(election.estado)}`}>
                                  {getStatusIcon(election.estado)}
                                  <span className="capitalize">{election.estado}</span>
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{election.descripcion || 'Sin descripción'}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>{new Date(election.fecha_inicio).toLocaleDateString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <UsersIcon className="w-4 h-4" />
                                  <span>{election.total_votos_emitidos || 0}/{election.total_votantes_habilitados || 0} votos</span>
                                </span>
                                {election.tipoEleccion && (
                                  <span className="bg-white px-2 py-1 rounded text-xs border">
                                    {election.tipoEleccion.nombre_tipo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleViewCandidates(election.id_eleccion)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Ver candidatos"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleElectionSettings(election.id_eleccion)}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Configuración"
                              >
                                <Cog6ToothIcon className="w-4 h-4" />
                              </button>
                              {election.estado === 'configuracion' && (
                                <button
                                  onClick={() => handleActivateElection(election.id_eleccion)}
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Activar elección"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                              {election.estado === 'activa' && (
                                <button
                                  onClick={() => handleFinalizeElection(election.id_eleccion)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Finalizar elección"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 overflow-y-auto">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Actividad Reciente</h3>
                </div>
                {safeStats.recent_activity && safeStats.recent_activity.length > 0 ? (
                  <div className="space-y-2">
                    {safeStats.recent_activity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{activity.candidate || 'Actividad'}</p>
                          <p className="text-xs text-gray-600 truncate">{activity.election || 'Sin especificar'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ClockIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No hay actividad reciente</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-700 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">⚡</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Acciones Rápidas</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Crear Elección</span>
                  </button>

                  <button 
                    onClick={() => navigate('/dashboard/real-time', { replace: true })}
                    className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>Dashboard Tiempo Real</span>
                  </button>

                  <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <UsersIcon className="w-4 h-4" />
                    <span>Gestionar Usuarios</span>
                  </button>

                  <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <ChartPieIcon className="w-4 h-4" />
                    <span>Ver Reportes</span>
                  </button>

                  <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Estado del Sistema</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Sistema</span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Activo</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Base de Datos</span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Conectada</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Última Actualización</span>
                    <span className="text-gray-900 font-medium">Hace 30s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Usuarios Activos</span>
                    <span className="text-gray-900 font-medium">{safeStats.summary.total_voters}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal - Solo renderizar si está disponible */}
      {isCreateModalOpen && CreateModal && (
        <Suspense fallback={<LoadingFallback />}>
          <CreateModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onElectionCreated={handleElectionCreated}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AdminDashboard