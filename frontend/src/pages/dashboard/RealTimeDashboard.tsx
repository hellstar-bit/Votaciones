// 📁 frontend/src/pages/dashboard/RealTimeDashboard.tsx - DASHBOARD COMPLETO
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom' // ✅ Agregar useNavigate
import { 
  ChartBarIcon, 
  UsersIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  SignalIcon,
  SunIcon,
  MoonIcon,
  ChartPieIcon,
  TrophyIcon,
  FireIcon,
  MapPinIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'
import io, { Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

// ✅ COLORES SENA + Paleta extendida
const COLORS = [
  '#39A900', '#2d8400', '#3B82F6', '#EF4444', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6366F1',
  '#F97316', '#10B981', '#E11D48', '#7C3AED', '#059669'
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
  tipo?: string
  sede?: string
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

// ✅ FUNCIONES AUXILIARES
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num)
}

const formatPercentage = (percent: number): string => {
  return `${percent.toFixed(1)}%`
}

const RealTimeDashboard = () => {
  const navigate = useNavigate() // ✅ Agregar navigate
  const { user, token, logout } = useAuthStore() // ✅ Agregar logout
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedElection, setSelectedElection] = useState<ElectionStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [voteHistory, setVoteHistory] = useState<Array<{ time: string, votes: number, participation: number }>>([])
  const [alerts, setAlerts] = useState<Array<{ id: string, message: string, type: string, time: Date }>>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hourlyData, setHourlyData] = useState<Array<{ hour: string, votes: number, elections: number }>>([])
  const [typeDistribution, setTypeDistribution] = useState<Array<{ name: string, value: number, color: string }>>([])
  const [participationByHour, setParticipationByHour] = useState<Array<{ hour: string, rate: number }>>([])
  
  const socketRef = useRef<Socket | null>(null)

  // ✅ FUNCIÓN PARA CERRAR SESIÓN
  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    logout()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }

  // ✅ GENERAR DATOS SIMULADOS PARA DEMO

  // ✅ CLASES DE TEMA DINÁMICO
  const themeClasses = {
    background: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    headerBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    borderLight: isDarkMode ? 'border-gray-600' : 'border-gray-100',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    selectedBg: isDarkMode ? 'bg-sena-900/20 border-sena-500' : 'bg-sena-50 border-sena-500'
  }

  // ✅ FUNCIÓN PARA CERRAR SESIÓN
  // (Eliminada declaración duplicada de handleLogout)
  const generateMockData = () => {
    // Datos por hora (últimas 24 horas)
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date()
      hour.setHours(hour.getHours() - (23 - i))
      return {
        hour: hour.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        votes: Math.floor(Math.random() * 200) + 50,
        elections: Math.floor(Math.random() * 5) + 1
      }
    })
    setHourlyData(hours)

    // Distribución por tipo
    const types = [
      { name: 'Centro', value: 45, color: COLORS[0] },
      { name: 'Sede', value: 35, color: COLORS[1] },
      { name: 'Ficha', value: 20, color: COLORS[2] }
    ]
    setTypeDistribution(types)

    // Participación por hora
    const participation = hours.map(h => ({
      hour: h.hour,
      rate: Math.random() * 40 + 30 // 30-70%
    }))
    setParticipationByHour(participation)
  }

  // Conectar WebSocket
  useEffect(() => {
    if (!token) {
      console.log('❌ No hay token para WebSocket');
      return;
    }

    console.log('🔌 Iniciando conexión WebSocket...')
    console.log('🔑 Token disponible:', !!token)
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
    const wsUrl = apiUrl.replace('/api/v1', '')
    console.log('📡 URL WebSocket:', `${wsUrl}/dashboard`)
    
    socketRef.current = io(`${wsUrl}/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      forceNew: true,
    })

    const socket = socketRef.current

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado al dashboard WebSocket:', socket.id)
      setIsConnected(true)
      toast.success('Dashboard conectado en tiempo real')
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

    socket.on('error', (error) => {
      console.error('🚨 Error del servidor:', error)
      toast.error(`Error del servidor: ${error.message || 'Error desconocido'}`)
    })

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
      
      // Generar datos adicionales para visualización
      generateMockData()
      
      // Inicializar historial de votos mejorado
      const now = new Date()
      const history = Array.from({ length: 15 }, (_, i) => ({
        time: new Date(now.getTime() - (14 - i) * 60000).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        votes: Math.floor(Math.random() * 100) + 20,
        participation: Math.random() * 30 + 40 // 40-70%
      }))
      setVoteHistory(history)
    })

    // Nuevos votos
    socket.on('new-vote', (data: VoteUpdate) => {
      console.log('🗳️ Nuevo voto recibido:', data)
      setLastUpdate(new Date())
      
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

      setSelectedElection(prev => 
        prev?.id === data.electionId 
          ? { ...prev, estadisticas: data.stats }
          : prev
      )
      
      // Actualizar gráficos en tiempo real
      setVoteHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          votes: data.stats.total_votos,
          participation: data.stats.participacion_porcentaje
        }
        return [...prev.slice(1), newEntry]
      })
      
      const newAlert = {
        id: `vote-${Date.now()}`,
        message: `Nuevo voto registrado en ${data.electionId}`,
        type: 'info',
        time: new Date()
      }
      setAlerts(prev => [...prev.slice(-4), newAlert])
    })

    // Manejar alertas del sistema
    socket.on('alert', (alert: { message: string, type: string, timestamp: string }) => {
      const newAlert = {
        id: `alert-${Date.now()}`,
        message: alert.message,
        type: alert.type,
        time: new Date(alert.timestamp)
      }
      setAlerts(prev => [...prev.slice(-4), newAlert])
      
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

  // ✅ PANTALLA DE CARGA
  if (!dashboardData) {
    return (
      <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sena-500 to-sena-600 rounded-xl flex items-center justify-center shadow-lg mb-6 mx-auto">
            <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cargando Dashboard</h2>
          <p className="text-lg mb-4">Sistema de Votaciones SENA</p>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-sena-500' : 'bg-red-500'}`}></div>
            <span className={themeClasses.textMuted}>
              {isConnected ? 'Conectado' : 'Conectando...'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text}`}>
      {/* Header compacto para maximizar espacio */}
      <header className={`${themeClasses.headerBg} border-b ${themeClasses.border} shadow-sm`}>
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sena-500 to-sena-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Dashboard en Tiempo Real - SENA</h1>
              </div>
              
              {/* Indicador de conexión compacto */}
              <div className="flex items-center space-x-2 px-2 py-1 rounded-full bg-sena-50 dark:bg-sena-900/20">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-sena-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-medium text-sena-700 dark:text-sena-300">
                  {isConnected ? 'EN VIVO' : 'DESCONECTADO'}
                </span>
              </div>
            </div>

            {/* Lado derecho con controles */}
            <div className="flex items-center space-x-3">
              {/* Toggle tema oscuro */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${themeClasses.hover} border ${themeClasses.border}`}
                title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                {isDarkMode ? (
                  <SunIcon className="w-4 h-4 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Información del usuario */}
              <div className="text-right">
                <p className="text-xs font-mono">
                  {lastUpdate.toLocaleTimeString('es-ES')}
                </p>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {user?.nombre_completo} ({user?.rol})
                </p>
              </div>

              {/* Botón de cerrar sesión - MÁS PROMINENTE */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 bg-red-500 hover:bg-red-600 text-white border border-red-600 hover:border-red-700 shadow-sm hover:shadow-md"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal - Pantalla completa */}
      <div className="p-4 space-y-4 max-w-full overflow-hidden">
        {/* KPIs compactos en una fila */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Elecciones</p>
                <p className="text-xl font-bold text-sena-600">{dashboardData.activeElections}</p>
              </div>
              <CheckCircleIcon className="w-6 h-6 text-sena-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Total Votos</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatNumber(dashboardData.elections.reduce((acc, election) => 
                    acc + election.estadisticas.total_votos, 0
                  ))}
                </p>
              </div>
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Habilitados</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatNumber(dashboardData.elections.reduce((acc, election) => 
                    acc + election.estadisticas.total_votantes_habilitados, 0
                  ))}
                </p>
              </div>
              <EyeIcon className="w-6 h-6 text-amber-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Participación</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatPercentage(
                    dashboardData.elections.length > 0
                      ? dashboardData.elections.reduce((acc, election) => 
                          acc + election.estadisticas.participacion_porcentaje, 0
                        ) / dashboardData.elections.length
                      : 0
                  )}
                </p>
              </div>
              <SignalIcon className="w-6 h-6 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Votos/Min</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.floor(Math.random() * 15) + 5}
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${themeClasses.textMuted} text-xs`}>Promedio</p>
                <p className="text-xl font-bold text-indigo-600">
                  {formatPercentage(Math.random() * 20 + 60)}
                </p>
              </div>
              <TrophyIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </motion.div>
        </div>

        {/* Grid principal de gráficos - 3 filas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96">
          {/* Gráfico principal de tendencias - 2 columnas */}
          <div className={`lg:col-span-2 ${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2 text-sena-600" />
              Tendencia de Votos en Tiempo Real
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={voteHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <YAxis 
                  yAxisId="votes"
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <YAxis 
                  yAxisId="participation"
                  orientation="right"
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', 
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                />
                <Area 
                  yAxisId="votes"
                  type="monotone" 
                  dataKey="votes" 
                  fill="#39A900" 
                  fillOpacity={0.1}
                  stroke="#39A900" 
                  strokeWidth={3}
                />
                <Line 
                  yAxisId="participation"
                  type="monotone" 
                  dataKey="participation" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de elecciones activas */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-sena-600" />
              Elecciones Activas
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dashboardData.elections.map((election) => (
                <motion.div
                  key={election.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedElection(election)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border text-sm ${
                    selectedElection?.id === election.id
                      ? themeClasses.selectedBg
                      : `${themeClasses.hover} ${themeClasses.borderLight}`
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className={`font-medium ${themeClasses.text} mb-1 text-sm`}>
                        {election.titulo}
                      </h4>
                      <p className={`text-xs ${themeClasses.textMuted}`}>
                        {election.estadisticas.total_votos} votos • {formatPercentage(election.estadisticas.participacion_porcentaje)}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-sena-500 rounded-full animate-pulse"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Gráfico de distribución por tipo */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ChartPieIcon className="w-5 h-5 mr-2 text-purple-600" />
              Tipos de Elección
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', 
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segunda fila de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-80">
          {/* Gráfico de barras por hora */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
              Votos por Hora (24h)
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', 
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="votes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resultados de elección seleccionada mejorado */}
          {selectedElection && (
            <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <TrophyIcon className="w-5 h-5 mr-2 text-amber-600" />
                {selectedElection.titulo}
              </h3>
              
              <div className="mb-4">
                <div className={`flex justify-between text-sm ${themeClasses.textMuted} mb-2`}>
                  <span>Participación Global</span>
                  <span className="font-semibold">{formatPercentage(selectedElection.estadisticas.participacion_porcentaje)}</span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                  <div 
                    className="bg-sena-500 h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${selectedElection.estadisticas.participacion_porcentaje}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto">
                {selectedElection.estadisticas.votos_por_candidato.map((candidato, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className={`text-sm font-medium truncate ${themeClasses.text}`}>
                        {candidato.candidato}
                      </span>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`text-lg font-bold ${themeClasses.text}`}>{candidato.votos}</p>
                      <p className={`text-xs ${themeClasses.textMuted}`}>
                        {formatPercentage(candidato.porcentaje)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico radial de participación */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <SignalIcon className="w-5 h-5 mr-2 text-purple-600" />
              Participación por Hora
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={participationByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', 
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Participación']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tercera fila - Estadísticas adicionales y alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-64">
          {/* Métricas de rendimiento */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FireIcon className="w-5 h-5 mr-2 text-red-500" />
              Métricas de Sistema
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textMuted}`}>Conexiones activas</span>
                <span className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 50) + 25}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textMuted}`}>Latencia promedio</span>
                <span className="text-lg font-bold text-blue-600">{Math.floor(Math.random() * 20) + 10}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textMuted}`}>Tiempo activo</span>
                <span className="text-lg font-bold text-purple-600">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textMuted}`}>Votos procesados</span>
                <span className="text-lg font-bold text-amber-600">{formatNumber(Math.floor(Math.random() * 5000) + 1000)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textMuted}`}>Errores (24h)</span>
                <span className="text-lg font-bold text-red-600">{Math.floor(Math.random() * 3)}</span>
              </div>
            </div>
          </div>

          {/* Top candidatos globales */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Top Candidatos Global
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Ana García', votes: 1245, percentage: 34.2 },
                { name: 'Carlos López', votes: 1123, percentage: 30.8 },
                { name: 'María Rodríguez', votes: 987, percentage: 27.1 },
                { name: 'Juan Pérez', votes: 289, percentage: 7.9 }
              ].map((candidate, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold`}
                         style={{ backgroundColor: COLORS[index] }}>
                      {index + 1}
                    </div>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {candidate.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${themeClasses.text}`}>{candidate.votes}</p>
                    <p className={`text-xs ${themeClasses.textMuted}`}>
                      {formatPercentage(candidate.percentage)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa de calor de actividad por región */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2 text-green-500" />
              Actividad por Región
            </h3>
            <div className="space-y-3">
              {[
                { region: 'Bogotá D.C.', activity: 89, votes: 2341 },
                { region: 'Antioquia', activity: 76, votes: 1876 },
                { region: 'Valle del Cauca', activity: 82, votes: 1654 },
                { region: 'Cundinamarca', activity: 71, votes: 1298 },
                { region: 'Atlántico', activity: 65, votes: 1087 }
              ].map((region, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {region.region}
                    </span>
                    <span className={`text-xs ${themeClasses.textMuted}`}>
                      {region.votes} votos
                    </span>
                  </div>
                  <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${region.activity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas del sistema mejoradas */}
          <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-amber-500" />
              Alertas del Sistema
            </h3>
            
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  Sistema funcionando correctamente
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg text-sm border ${
                        alert.type === 'error' 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
                          : alert.type === 'warning' 
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="flex-1">{alert.message}</span>
                        <span className="text-xs opacity-75 ml-2">
                          {alert.time.toLocaleTimeString('es-ES')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Barra de estado inferior */}
        <div className={`${themeClasses.cardBg} rounded-lg p-3 border ${themeClasses.border}`}>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={themeClasses.textMuted}>Sistema operativo</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                <span className={themeClasses.textMuted}>
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-4 h-4 text-gray-500" />
                <span className={themeClasses.textMuted}>
                  Mostrando datos en tiempo real
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-xs ${themeClasses.textMuted}`}>
                Última actualización: {lastUpdate.toLocaleString('es-ES')}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-sena-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-sena-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-sena-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeDashboard