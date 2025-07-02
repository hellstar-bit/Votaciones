// 📁 frontend/src/pages/dashboard/RealTimeDashboard.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  WifiIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import io, { Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

// ✅ DEFINIR COLORS - Array de colores para los gráficos
const COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1'  // indigo-500
]

// Interfaces para los datos
interface ElectionStats {
  id: number
  titulo: string
  estadisticas: {
    total_votos: number
    participacion_porcentaje: number
    total_votantes_habilitados: number
    votos_por_candidato: Array<{
      candidato: string
      votos: number
      porcentaje: number
    }>
  }
  estado: string
  fecha_inicio: string
  fecha_fin: string
}

interface DashboardData {
  activeElections: number
  elections: ElectionStats[]
  totalVotes: number
  totalVoters: number
  participationRate: number
}

interface VoteUpdate {
  electionId: number
  stats: ElectionStats['estadisticas']
  timestamp: string
}

// ✅ FUNCIONES AUXILIARES - Definir funciones que faltan
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num)
}

const formatPercentage = (percent: number): string => {
  return `${percent.toFixed(1)}%`
}

const RealTimeDashboard = () => {
  const { user, token } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedElection, setSelectedElection] = useState<ElectionStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [voteHistory, setVoteHistory] = useState<Array<{ time: string, votes: number }>>([])
  const [alerts, setAlerts] = useState<Array<{ id: string, message: string, type: string, time: Date }>>([])
  
  const socketRef = useRef<Socket | null>(null)

  // Conectar WebSocket
  useEffect(() => {
    if (!token) {
      console.log('❌ No hay token para WebSocket');
      return;
    }

    console.log('🔌 Iniciando conexión WebSocket...')
    console.log('🔑 Token disponible:', !!token)
    
    // ✅ CORREGIR URL - quitar /api/v1 para WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
    const wsUrl = apiUrl.replace('/api/v1', '')
    console.log('📡 URL WebSocket:', `${wsUrl}/dashboard`)
    
    socketRef.current = io(`${wsUrl}/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'], // ✅ Permitir fallback a polling
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      forceNew: true, // ✅ Forzar nueva conexión
    })

    const socket = socketRef.current

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado al dashboard WebSocket:', socket.id)
      setIsConnected(true)
      toast.success('Dashboard conectado en tiempo real')
      
      // ✅ Solicitar estado de conexión para debug
      socket.emit('get-connection-status')
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error)
      setIsConnected(false)
      toast.error(`Error de conexión: ${error.message}`)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del dashboard WebSocket:', reason)
      setIsConnected(false)
      toast.error('Conexión perdida con el dashboard')
    })

    // ✅ Manejar errores del servidor
    socket.on('error', (error) => {
      console.error('🚨 Error del servidor:', error)
      toast.error(`Error del servidor: ${error.message || 'Error desconocido'}`)
    })

    // ✅ Debug: Estado de conexión
    socket.on('connection-status', (status) => {
      console.log('📊 Estado de conexión:', status)
    })

    // Datos iniciales
    socket.on('initial-dashboard-data', (data: DashboardData) => {
      console.log('📊 Datos iniciales recibidos:', data)
      setDashboardData(data)
      
      if (data.elections.length > 0) {
        setSelectedElection(data.elections[0])
      }
      
      // Inicializar historial de votos
      const now = new Date()
      const history = Array.from({ length: 10 }, (_, i) => ({
        time: new Date(now.getTime() - (9 - i) * 60000).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        votes: Math.floor(Math.random() * 50) // Datos simulados iniciales
      }))
      setVoteHistory(history)
    })

    // Nuevos votos
    socket.on('new-vote', (data: VoteUpdate) => {
      console.log('🗳️ Nuevo voto recibido:', data)
      setLastUpdate(new Date())
      
      // Actualizar datos de la elección
      setDashboardData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          elections: prev.elections.map(election => 
            election.id === data.electionId 
              ? { ...election, estadisticas: data.stats }
              : election
          )
        }
      })

      // Actualizar elección seleccionada
      setSelectedElection(prev => 
        prev?.id === data.electionId 
          ? { ...prev, estadisticas: data.stats }
          : prev
      )
      
      // Actualizar historial de votos
      setVoteHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          votes: data.stats.total_votos
        }
        return [...prev.slice(1), newEntry]
      })
      
      // Agregar alerta de nuevo voto
      const newAlert = {
        id: `vote-${Date.now()}`,
        message: `Nuevo voto registrado en ${data.electionId}`,
        type: 'info',
        time: new Date()
      }
      setAlerts(prev => [...prev.slice(-4), newAlert]) // Mantener solo 5 alertas
    })

    // ✅ Manejar alertas del sistema
    socket.on('alert', (alert: { message: string, type: string, timestamp: string }) => {
      const newAlert = {
        id: `alert-${Date.now()}`,
        message: alert.message,
        type: alert.type,
        time: new Date(alert.timestamp)
      }
      setAlerts(prev => [...prev.slice(-4), newAlert])
      
      // Mostrar toast según tipo
      if (alert.type === 'error') {
        toast.error(alert.message)
      } else if (alert.type === 'warning') {
        toast(alert.message, { icon: '⚠️' })
      } else {
        toast.success(alert.message)
      }
    })

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        console.log('🔌 Desconectando WebSocket...')
        socketRef.current.disconnect()
      }
    }
  }, [token])

  // ✅ MANEJO DE CARGA - Mostrar loading mientras no hay datos
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Cargando dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">
            {isConnected ? 'Conectado' : 'Conectando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Dashboard en Tiempo Real</h1>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-300">
                {isConnected ? 'En vivo' : 'Desconectado'}
              </span>
              {isConnected && <WifiIcon className="w-4 h-4 text-green-500" />}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Última actualización</p>
              <p className="text-sm font-mono">
                {lastUpdate.toLocaleTimeString('es-ES')}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-400">Usuario</p>
              <p className="text-sm font-medium">{user?.nombre_completo}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="p-6 space-y-6">
        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Elecciones Activas</p>
                <p className="text-3xl font-bold text-green-500">
                  {dashboardData.activeElections}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Votos</p>
                <p className="text-3xl font-bold text-blue-500">
                  {formatNumber(dashboardData.elections.reduce((acc, election) => 
                    acc + election.estadisticas.total_votos, 0
                  ))}
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Votantes Habilitados</p>
                <p className="text-3xl font-bold text-yellow-500">
                  {formatNumber(dashboardData.elections.reduce((acc, election) => 
                    acc + election.estadisticas.total_votantes_habilitados, 0
                  ))}
                </p>
              </div>
              <EyeIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Participación</p>
                <p className="text-3xl font-bold text-purple-500">
                  {formatPercentage(
                    dashboardData.elections.length > 0
                      ? dashboardData.elections.reduce((acc, election) => 
                          acc + election.estadisticas.participacion_porcentaje, 0
                        ) / dashboardData.elections.length
                      : 0
                  )}
                </p>
              </div>
              <SignalIcon className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de elecciones */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-green-500" />
              Elecciones en Curso
            </h3>
            
            <div className="space-y-3">
              {dashboardData.elections.map((election) => (
                <motion.div
                  key={election.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedElection(election)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedElection?.id === election.id
                      ? 'bg-green-900/50 border border-green-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">
                        {election.titulo}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {election.estadisticas.total_votos} votos •{' '}
                        {formatPercentage(election.estadisticas.participacion_porcentaje)} participación
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Gráfica de tendencia de votos */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2 text-blue-500" />
              Tendencia de Votos
            </h3>
            
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={voteHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Resultados de elección seleccionada */}
          {selectedElection && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-yellow-500" />
                {selectedElection.titulo}
              </h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Participación</span>
                  <span>{formatPercentage(selectedElection.estadisticas.participacion_porcentaje)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${selectedElection.estadisticas.participacion_porcentaje}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedElection.estadisticas.votos_por_candidato.map((candidato, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium truncate">
                        {candidato.candidato}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{candidato.votos}</p>
                      <p className="text-xs text-gray-400">
                        {formatPercentage(candidato.porcentaje)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alertas del sistema */}
        {alerts.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Alertas del Sistema
            </h3>
            
            <div className="space-y-2">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 rounded-lg text-sm ${
                      alert.type === 'error' ? 'bg-red-900/50 text-red-200' :
                      alert.type === 'warning' ? 'bg-yellow-900/50 text-yellow-200' :
                      'bg-blue-900/50 text-blue-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{alert.message}</span>
                      <span className="text-xs opacity-75">
                        {alert.time.toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeDashboard