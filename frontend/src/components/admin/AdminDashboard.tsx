// 📁 frontend/src/components/admin/AdminDashboard.tsx - SOLUCIÓN DEFINITIVA PARA ERROR insertBefore
import React, { useState, useEffect, useMemo } from 'react'
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
import CreateElectionModal from '../modals/CreateElectionModal'
import CandidatesManagement from '../candidates/CandidatesManagement'
import ElectionSettings from '../candidates/ElectionSettings'

// Componente de Loading
const LoadingSpinner = React.memo(() => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
      <p className="text-gray-600 font-medium">Cargando dashboard...</p>
    </div>
  </div>
))
LoadingSpinner.displayName = 'LoadingSpinner'

// Componente de Estadísticas
interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  bgColor: string
}

const StatsCard = React.memo<StatsCardProps>(({ title, value, subtitle, icon, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-5 text-white relative overflow-hidden`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-white/70 text-xs mt-1">{subtitle}</p>
      </div>
      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
  </div>
))
StatsCard.displayName = 'StatsCard'

// Componente de Card de Elección
interface ElectionCardProps {
  election: Election
  onViewCandidates: (id: number) => void
  onSettings: (id: number) => void
  onActivate: (id: number) => void
  onFinalize: (id: number) => void
}

const ElectionCard = React.memo<ElectionCardProps>(({ election, onViewCandidates, onSettings, onActivate, onFinalize }) => {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800'
      case 'configuracion': return 'bg-yellow-100 text-yellow-800'
      case 'finalizada': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <PlayIcon className="w-4 h-4" />
      case 'configuracion': return <Cog6ToothIcon className="w-4 h-4" />
      case 'finalizada': return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelada': return <ExclamationTriangleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
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
            onClick={() => onViewCandidates(election.id_eleccion)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="Ver candidatos"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSettings(election.id_eleccion)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Configuración"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
          {election.estado === 'configuracion' && (
            <button
              onClick={() => onActivate(election.id_eleccion)}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              title="Activar elección"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}
          {election.estado === 'activa' && (
            <button
              onClick={() => onFinalize(election.id_eleccion)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Finalizar elección"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
ElectionCard.displayName = 'ElectionCard'

// Componente principal
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Estados para datos del dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'candidates' | 'settings'>('dashboard')
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Marcar componente como montado para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar datos del dashboard desde la API
  useEffect(() => {
    if (!mounted) return
    
    fetchDashboardData()

    // Función para actualizar sin mostrar loading
    const updateDataSilently = async () => {
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
    }

    // Actualizar cada 30 segundos de forma silenciosa
    const interval = setInterval(updateDataSilently, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  // Función para la carga inicial
  const fetchDashboardData = async () => {
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
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handlers memoizados para evitar re-renders innecesarios
  const handleActivateElection = async (electionId: number) => {
    try {
      await electionsApi.activate(electionId)
      toast.success('Elección activada exitosamente')
      await fetchDashboardData()
    } catch (error) {
      const errorMessage = handleApiError(error, 'activando elección')
      toast.error(`Error activando elección: ${errorMessage}`)
    }
  }

  const handleFinalizeElection = async (electionId: number) => {
    try {
      await electionsApi.finalize(electionId)
      toast.success('Elección finalizada exitosamente')
      await fetchDashboardData()
    } catch (error) {
      const errorMessage = handleApiError(error, 'finalizando elección')
      toast.error(`Error finalizando elección: ${errorMessage}`)
    }
  }

  const handleElectionCreated = async () => {
    await fetchDashboardData()
    toast.success('Los datos se han actualizado')
  }

  const handleViewCandidates = (electionId: number) => {
    setSelectedElectionId(electionId)
    setCurrentView('candidates')
  }

  const handleElectionSettings = (electionId: number) => {
    setSelectedElectionId(electionId)
    setCurrentView('settings')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedElectionId(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Stats seguras memoizadas
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

  // No renderizar hasta que esté montado para evitar problemas de hidratación
  if (!mounted || loading) {
    return <LoadingSpinner />
  }

  // Navegación condicional con keys únicas
  if (currentView === 'candidates' && selectedElectionId) {
    return (
      <CandidatesManagement
        key={`candidates-${selectedElectionId}`}
        electionId={selectedElectionId}
        onBack={handleBackToDashboard}
      />
    )
  }

  if (currentView === 'settings' && selectedElectionId) {
    return (
      <ElectionSettings
        key={`settings-${selectedElectionId}`}
        electionId={selectedElectionId}
        onBack={handleBackToDashboard}
      />
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

              {/* Dashboard en tiempo real */}
              <button
                onClick={() => navigate('/dashboard/real-time')}
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

      {/* Contenido Principal */}
      <main className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Elecciones"
              value={safeStats.summary.total_elections}
              subtitle="En el sistema"
              icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
              bgColor="bg-green-500"
            />
            <StatsCard
              title="Elecciones Activas"
              value={safeStats.summary.active_elections}
              subtitle="En proceso"
              icon={<PlayIcon className="w-6 h-6" />}
              bgColor="bg-green-600"
            />
            <StatsCard
              title="Total Votos"
              value={safeStats.summary.total_votes}
              subtitle="Registrados"
              icon={<UsersIcon className="w-6 h-6" />}
              bgColor="bg-green-500"
            />
            <StatsCard
              title="Participación"
              value={`${safeStats.summary.participation_rate.toFixed(1)}%`}
              subtitle="Promedio"
              icon={<ChartPieIcon className="w-6 h-6" />}
              bgColor="bg-green-700"
            />
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
            {/* Lista de Elecciones */}
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
                        <ElectionCard
                          key={`election-${election.id_eleccion}-${election.estado}`}
                          election={election}
                          onViewCandidates={handleViewCandidates}
                          onSettings={handleElectionSettings}
                          onActivate={handleActivateElection}
                          onFinalize={handleFinalizeElection}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Derecho */}
            <div className="space-y-4 overflow-y-auto">
              {/* Actividad Reciente */}
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
                      <div key={`activity-${activity.id || index}-${activity.candidate || 'unknown'}`} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
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

              {/* Acciones Rápidas */}
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
                    onClick={() => navigate('/dashboard/real-time')}
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

              {/* Estado del Sistema */}
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

      {/* Modal Crear Elección - renderizado condicional seguro */}
      {isCreateModalOpen && (
        <CreateElectionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onElectionCreated={handleElectionCreated}
        />
      )}
    </div>
  )
}

export default AdminDashboard