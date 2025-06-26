import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  ChartPieIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'

// Interfaces para tipos de datos
interface ElectionStats {
  id: number
  titulo: string
  estado: 'configuracion' | 'activa' | 'finalizada' | 'cancelada'
  total_votantes: number
  total_votos: number
  porcentaje_participacion: number
  fecha_inicio: string
  fecha_fin: string
}

interface DashboardStats {
  total_elections: number
  active_elections: number
  total_votes_today: number
  participation_rate: number
  recent_activity: Array<{
    id: number
    election: string
    candidate: string
    timestamp: string
  }>
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  
  // Estados para datos del dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [elections, setElections] = useState<ElectionStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedElection, setSelectedElection] = useState<number | null>(null)

  // Simular datos del dashboard (reemplazar con API real)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Datos simulados - reemplazar con llamadas reales al backend
        setStats({
          total_elections: 12,
          active_elections: 3,
          total_votes_today: 247,
          participation_rate: 68.5,
          recent_activity: [
            { id: 1, election: "Representante Estudiantil TIC", candidate: "María González", timestamp: "2025-01-27T10:30:00Z" },
            { id: 2, election: "Delegado de Sede", candidate: "VOTO EN BLANCO", timestamp: "2025-01-27T10:25:00Z" },
            { id: 3, election: "Representante Estudiantil TIC", candidate: "Carlos López", timestamp: "2025-01-27T10:20:00Z" },
          ]
        })
        
        setElections([
          {
            id: 1,
            titulo: "Representante Estudiantil TIC",
            estado: "activa",
            total_votantes: 150,
            total_votos: 89,
            porcentaje_participacion: 59.3,
            fecha_inicio: "2025-01-27T08:00:00Z",
            fecha_fin: "2025-01-27T18:00:00Z"
          },
          {
            id: 2,
            titulo: "Delegado de Sede Central",
            estado: "activa",
            total_votantes: 300,
            total_votos: 210,
            porcentaje_participacion: 70.0,
            fecha_inicio: "2025-01-27T08:00:00Z",
            fecha_fin: "2025-01-27T17:00:00Z"
          },
          {
            id: 3,
            titulo: "Representante Ficha 3037689",
            estado: "configuracion",
            total_votantes: 25,
            total_votos: 0,
            porcentaje_participacion: 0,
            fecha_inicio: "2025-01-28T08:00:00Z",
            fecha_fin: "2025-01-28T16:00:00Z"
          }
        ])
        
        setLoading(false)
      } catch (error) {
        console.error('Error cargando datos:', error)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
                <p className="text-3xl font-bold text-gray-900">{stats?.total_elections}</p>
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
                <p className="text-3xl font-bold text-green-600">{stats?.active_elections}</p>
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
                <p className="text-sm font-medium text-gray-600">Votos Hoy</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.total_votes_today}</p>
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
                <p className="text-3xl font-bold text-sena-600">{stats?.participation_rate}%</p>
              </div>
              <div className="w-12 h-12 bg-sena-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-sena-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Elecciones Activas */}
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
                    onClick={() => {/* TODO: Navegar a crear elección */}}
                  >
                    Nueva Elección
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {elections.map((election, index) => (
                    <motion.div
                      key={election.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-sena-300 transition-colors cursor-pointer"
                      onClick={() => setSelectedElection(election.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{election.titulo}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(election.estado)}`}>
                          {getStatusIcon(election.estado)}
                          {election.estado.charAt(0).toUpperCase() + election.estado.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Participación</p>
                          <p className="font-medium">{election.porcentaje_participacion.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Votos</p>
                          <p className="font-medium">{election.total_votos}/{election.total_votantes}</p>
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
                            style={{ width: `${election.porcentaje_participacion}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actividad Reciente */}
          <div>
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
                  {stats?.recent_activity.map((activity, index) => (
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
                  ))}
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
                  onClick={() => {/* TODO: Navegar a crear elección */}}
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
    </div>
  )
}

export default AdminDashboard