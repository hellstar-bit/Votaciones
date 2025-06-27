import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { dashboardApi, electionsApi,type Election,type  DashboardStats, handleApiError } from '../../services/api'
import Button from '../../components/ui/Button'
import CreateElectionModal from '../../components/modals/CreateElectionModal'
import CandidatesManagement from '../../components/candidates/CandidatesManagement'
import ElectionSettings from '../../components/candidates/ElectionSettings'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  
  // Estados para datos del dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'candidates' | 'settings'>('dashboard')
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null)

  // Cargar datos del dashboard desde la API
  useEffect(() => {
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
      // ✅ No cambia loading, por eso no se ve el refresh
    } catch (error) {
      console.error('Error actualizando datos:', error)
      // No mostrar toast para no molestar al usuario
    }
  }
  
  // Actualizar cada 1 minuto de forma silenciosa
  const interval = setInterval(updateDataSilently, 30000)
  
  return () => clearInterval(interval)
}, [])

  useEffect(() => {
  fetchDashboardData() // Carga inicial con loading
}, [])

// Función para la carga inicial (con loading)
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
    const errorMessage = handleApiError(error)
    toast.error(`Error cargando datos: ${errorMessage}`)
    console.error('Error cargando datos del dashboard:', error)
  } finally {
    setLoading(false)
  }
}


  // Función para activar una elección
  // Función para activar una elección
const handleActivateElection = async (electionId: number) => {
  try {
    await electionsApi.activate(electionId)
    toast.success('Elección activada exitosamente')
    
    // Recargar datos
    await fetchDashboardData()
  } catch (error) {
    const errorMessage = handleApiError(error)
    toast.error(`Error activando elección: ${errorMessage}`)
  }
}

// Función para finalizar una elección
const handleFinalizeElection = async (electionId: number) => {
  try {
    await electionsApi.finalize(electionId)
    toast.success('Elección finalizada exitosamente')
    
    // Recargar datos
    await fetchDashboardData()
  } catch (error) {
    const errorMessage = handleApiError(error)
    toast.error(`Error finalizando elección: ${errorMessage}`)
  }
}

// Manejar creación exitosa de elección
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
      default: return null
    }
  }

  if (loading) {
    if (currentView === 'candidates' && selectedElectionId) {
      return (
        <CandidatesManagement
          electionId={selectedElectionId}
          onBack={handleBackToDashboard}
        />
      )
    }

    if (currentView === 'settings' && selectedElectionId) {
      return (
        <ElectionSettings
          electionId={selectedElectionId}
          onBack={handleBackToDashboard}
        />
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-sena-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (currentView === 'candidates' && selectedElectionId) {
  return (
    <CandidatesManagement
      electionId={selectedElectionId}
      onBack={handleBackToDashboard}
    />
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sena-500 to-sena-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel Administrativo</h1>
                <p className="text-sm text-gray-500">Sistema de Votaciones SENA</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nombre_completo}</p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Elecciones</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.summary?.total_elections || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Elecciones Activas</p>
                <p className="text-3xl font-bold text-green-600">{stats?.summary?.active_elections || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <PlayIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votos</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.summary?.total_votes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participación</p>
                <p className="text-3xl font-bold text-sena-600">{stats?.summary?.participation_rate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-sena-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-sena-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Elecciones */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Elecciones</h2>
                  <Button
                    size="sm"
                    icon={<PlusIcon className="w-4 h-4" />}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Nueva Elección
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {elections.length > 0 ? elections.map((election, index) => (
                    <motion.div
                      key={election.id_eleccion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-sena-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{election.titulo}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(election.estado)}`}>
                            {getStatusIcon(election.estado)}
                            {election.estado.charAt(0).toUpperCase() + election.estado.slice(1)}
                          </span>
                          
                          {/* Botones de acción */}
                          <div className="flex space-x-2">
                            {election.estado === 'configuracion' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewCandidates(election.id_eleccion)}
                                  className="text-xs text-sena-600 border-sena-300 hover:bg-sena-50"
                                >
                                  Candidatos
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivateElection(election.id_eleccion)}
                                  className="text-xs"
                                >
                                  Activar
                                </Button>
                              </>
                            )}
                            
                            {election.estado === 'activa' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFinalizeElection(election.id_eleccion)}
                                className="text-xs"
                              >
                                Finalizar
                              </Button>
                            )}

                            {/* ✅ AGREGAR ESTE BOTÓN */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleElectionSettings(election.id_eleccion)}
                              className="text-xs text-gray-600 hover:text-gray-800"
                              icon={<Cog6ToothIcon className="w-4 h-4" />}
                            >
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Participación</p>
                          <p className="font-medium">
                            {election.total_votantes_habilitados > 0 
                              ? ((election.total_votos_emitidos / election.total_votantes_habilitados) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Votos</p>
                          <p className="font-medium">{election.total_votos_emitidos}/{election.total_votantes_habilitados}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Finaliza</p>
                          <p className="font-medium">
                            {new Date(election.fecha_fin).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-sena-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${election.total_votantes_habilitados > 0 
                                ? (election.total_votos_emitidos / election.total_votantes_habilitados) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Información adicional */}
                      <div className="mt-2 text-xs text-gray-500">
                        {election.tipoEleccion?.nombre_tipo} - {election.tipoEleccion?.nivel_aplicacion}
                        {election.centro && ` | ${election.centro.nombre_centro}`}
                        {election.sede && ` | ${election.sede.nombre_sede}`}
                        {election.ficha && ` | Ficha ${election.ficha.numero_ficha}`}
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center text-gray-500 py-8">
                      <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay elecciones disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar derecho */}
          <div>
            {/* Actividad Reciente */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.recent_activity && stats.recent_activity.length > 0 ? stats.recent_activity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-2 h-2 bg-sena-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.candidate}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.election}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center text-gray-500 py-4">
                      <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Acciones Rápidas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
              </div>
              
              <div className="p-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Crear Elección
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<UsersIcon className="w-4 h-4" />}
                  onClick={() => {/* TODO: Navegar a gestión de usuarios */}}
                >
                  Gestionar Usuarios
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<ChartPieIcon className="w-4 h-4" />}
                  onClick={() => {/* TODO: Navegar a reportes */}}
                >
                  Ver Reportes
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<Cog6ToothIcon className="w-4 h-4" />}
                  onClick={() => {/* TODO: Navegar a configuración */}}
                >
                  Configuración
                </Button>
                
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      {/* Modal Crear Elección */}
      <CreateElectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onElectionCreated={handleElectionCreated}
      />
    </div>
  )
}
export default AdminDashboard