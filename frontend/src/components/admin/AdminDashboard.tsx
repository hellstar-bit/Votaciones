// 📁 frontend/src/components/admin/AdminDashboard.tsx - ARCHIVO COMPLETO CORREGIDO
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  CalendarIcon,
  DocumentArrowDownIcon                               
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { dashboardApi, electionsApi, type Election, type DashboardStats, handleApiError } from '../../services/api'
import CreateElectionModal from '../modals/CreateElectionModal'
import CandidatesManagement from '../candidates/CandidatesManagement'
import ElectionSettings from '../candidates/ElectionSettings'
import ExportActaModal from '../modals/ExportActaModal' // ← AGREGAR ESTE IMPORT

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showExportActaModal, setShowExportActaModal] = useState(false)
  const [selectedElectionForActa, setSelectedElectionForActa] = useState<any>(null)
  // Estados para datos del dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
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
      } catch (error) {
        console.error('Error actualizando datos:', error)
      }
    }

    // Actualizar cada 30 segundos de forma silenciosa
    const interval = setInterval(updateDataSilently, 30000)
    return () => clearInterval(interval)
  }, [])

  // Función para la carga inicial
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      console.log('📊 Iniciando carga de datos del dashboard...')

      const [dashboardStats, allElections] = await Promise.all([
        dashboardApi.getStats(),
        electionsApi.getAll()
      ])

      console.log('📈 Dashboard stats recibidas:', dashboardStats)
      console.log('🗳️ Elecciones recibidas:', allElections)

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

  // Función para activar una elección
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

  // Función para finalizar una elección
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

  const handleExportActa = (election: any) => {
    if (election.estado !== 'finalizada') {
      toast.error('Solo se pueden generar actas de elecciones finalizadas')
      return
    }
    
    setSelectedElectionForActa(election)
    setShowExportActaModal(true)
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
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  // ✅ VALORES SEGUROS PARA EVITAR ERRORES UNDEFINED - CORREGIDO
  const safeStats = {
    summary: {
      total_elections: stats?.total_elections || 0,
      active_elections: stats?.active_elections || 0,
      total_votes: stats?.total_votes || 0,
      total_voters: stats?.total_voters || 0,
      participation_rate: stats?.participation_rate || 0,
    },
    recent_activity: stats?.recent_activity || []
  }

  // ✅ DEBUG: Mostrar estadísticas en consola
  console.log('🔍 Stats actuales:', stats)
  console.log('🔍 Safe stats:', safeStats)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // Navegación condicional
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
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* Header - más compacto y coherente */}
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

      {/* Contenido Principal - aprovecha todo el espacio */}
      <main className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Estadísticas - más compactas y coherentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Elecciones */}
            <motion.div 
              className="bg-green-500 rounded-xl p-5 text-white relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm font-medium">Total Elecciones</p>
                  <p className="text-2xl font-bold mt-1">{safeStats.summary.total_elections}</p>
                  <p className="text-gray-400 text-xs mt-1">En el sistema</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
            </motion.div>

            {/* Elecciones Activas */}
            <motion.div 
              className="bg-green-600 rounded-xl p-5 text-white relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -2 }}
            >
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
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
            </motion.div>

            {/* Total Votos */}
            <motion.div 
              className="bg-green-500 rounded-xl p-5 text-white relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
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
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
            </motion.div>

            {/* Participación */}
            <motion.div 
              className="bg-green-700 rounded-xl p-5 text-white relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -2 }}
            >
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
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
            </motion.div>
          </div>

          {/* Grid Principal - ocupa todo el espacio disponible */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
            {/* Lista de Elecciones - más ancha */}
            <div className="lg:col-span-3">
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 h-full flex flex-col"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
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
                      <AnimatePresence>
                        {elections.map((election, index) => (
                          <motion.div
                            key={election.id_eleccion}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
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
                                    <span>{election.total_votos_emitidos}/{election.total_votantes_habilitados} votos</span>
                                  </span>
                                  {election.tipoEleccion && (
                                    <span className="bg-white px-2 py-1 rounded text-xs border">
                                      {election.tipoEleccion.nombre_tipo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* ✅ BOTONES DE ACCIÓN - CON BOTÓN EXPORTAR ACTA */}
                              <div className="flex items-center space-x-2 ml-4">
                                {/* ✅ NUEVO: Botón Exportar Acta PDF */}
                                {election.estado === 'finalizada' && (
                                  <button
                                    onClick={() => handleExportActa(election)}
                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Exportar Acta PDF"
                                  >
                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {/* Botones existentes */}
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
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar Derecho - más compacto */}
            <div className="space-y-4 overflow-y-auto">
              {/* Actividad Reciente */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Actividad Reciente</h3>
                </div>
                {safeStats.recent_activity && safeStats.recent_activity.length > 0 ? (
                  <div className="space-y-2">
                    {safeStats.recent_activity.slice(0, 3).map((activity, index) => (
                      <div key={activity.id || index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
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
              </motion.div>

              {/* Acciones Rápidas */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
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
              </motion.div>

              {/* Estado del Sistema */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
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
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Crear Elección */}
      <CreateElectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onElectionCreated={handleElectionCreated}
      />

      {/* ✅ NUEVO: Modal Exportar Acta PDF */}
      {selectedElectionForActa && (
        <ExportActaModal
          isOpen={showExportActaModal}
          onClose={() => {
            setShowExportActaModal(false)
            setSelectedElectionForActa(null)
          }}
          election={selectedElectionForActa}
        />
      )}
    </div>
  )
}
export default AdminDashboard;