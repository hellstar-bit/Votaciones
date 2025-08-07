// 📁 frontend/src/pages/dashboard/RealTimeDashboard.tsx - VERSIÓN COMPLETA CORREGIDA
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import {
  ArrowPathIcon,
  SignalIcon,
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  BoltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { dashboardApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import AdminLayout from '../../components/layout/AdminLayout'
import toast from 'react-hot-toast'

// ✅ INTERFACES CORREGIDAS Y COMPLETAS
interface ElectionStats {
  id: number
  titulo: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
  tipo_eleccion?: string
  estadisticas: {
    total_votos: number
    total_votantes_habilitados: number
    participacion_porcentaje: number
    votos_por_candidato: Array<{
      candidato_id: number
      candidato_nombre: string
      votos: number
      porcentaje: number
    }>
  }
}

interface VoterActivity {
  id: number
  votante_nombre: string
  eleccion_titulo: string
  candidato_nombre: string
  timestamp: string
  metodo_identificacion: string
}

interface DashboardData {
  activeElections: number
  elections: ElectionStats[]
  recent_activity: VoterActivity[]
  summary: {
    total_elections: number
    active_elections: number
    total_votes: number
    total_voters: number
    participation_rate: number
  }
}

interface VoteHistoryEntry {
  time: string
  votes: number
  participation: number
  label?: string
}

interface SystemAlert {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  time: Date
}

const CHART_COLORS = [
  '#0F766E', '#059669', '#10B981', '#34D399', '#6EE7B7',
  '#99F6E4', '#CCFBF1', '#F0FDFA', '#E11D48', '#F59E0B'
]

const RealTimeDashboard = () => {
  // ✅ ESTADOS PRINCIPALES
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedElection, setSelectedElection] = useState<ElectionStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [voteHistory, setVoteHistory] = useState<VoteHistoryEntry[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Referencias
  const socketRef = useRef<Socket | null>(null)
  const { token } = useAuthStore()

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    if (!token) return

    const loadInitialData = async () => {
      try {
        console.log('📊 Cargando datos iniciales del dashboard...')
        
        const [electionsResponse, globalStats] = await Promise.all([
          dashboardApi.getRealTimeElections(),
          dashboardApi.getGlobalStats()
        ])
        
        const initialData: DashboardData = {
          activeElections: electionsResponse.filter(e => e.estado === 'activa').length,
          elections: electionsResponse,
          recent_activity: globalStats.recent_activity || [],
          summary: globalStats.summary
        }
        
        setDashboardData(initialData)
        
        // Seleccionar la primera elección activa automáticamente
        const activeElection = electionsResponse.find(e => e.estado === 'activa')
        if (activeElection) {
          setSelectedElection(activeElection)
          generateVoteHistory(activeElection)
        } else if (electionsResponse.length > 0) {
          setSelectedElection(electionsResponse[0])
          generateVoteHistory(electionsResponse[0])
        }
        
        setLoading(false)
        console.log('✅ Datos iniciales cargados:', initialData)
        
      } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error)
        toast.error('Error cargando datos del dashboard')
        setLoading(false)
      }
    }

    loadInitialData()
  }, [token])

  // ✅ CONFIGURAR WEBSOCKET - CORREGIDO PARA EVITAR BUCLES
  useEffect(() => {
    if (!token) return

    setupWebSocket()

    return () => {
      if (socketRef.current) {
        console.log('🔌 Cerrando conexión WebSocket')
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [token]) // ✅ SOLO depende de token, NO de dashboardData

  // ✅ FUNCIÓN PARA CONFIGURAR WEBSOCKET - SIN DEPENDENCIAS CIRCULARES
  const setupWebSocket = () => {
    if (!token) return

    // ✅ EVITAR MÚLTIPLES CONEXIONES
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔌 WebSocket ya conectado, evitando reconexión')
      return
    }

    console.log('🔌 Configurando WebSocket...')
    
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 3, // ✅ REDUCIR INTENTOS
      reconnectionDelay: 2000, // ✅ AUMENTAR DELAY
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 3
    })

    socketRef.current = socket

    // ✅ EVENTOS DEL WEBSOCKET
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado')
      setIsConnected(true)
      setReconnectAttempts(0)
      
      // Solo mostrar alerta de conexión una vez
      if (reconnectAttempts > 0) {
        addAlert('Conexión restaurada', 'success')
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason)
      setIsConnected(false)
      
      // ✅ NO intentar reconectar si fue desconexión manual
      if (reason === 'io client disconnect') {
        return
      }
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconectado después de ${attemptNumber} intentos`)
      setIsConnected(true)
      setReconnectAttempts(0)
      addAlert('Conexión restaurada', 'success')
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intento de reconexión ${attemptNumber}`)
      setReconnectAttempts(attemptNumber)
    })

    socket.on('reconnect_error', (error) => {
      console.error('❌ Error de reconexión:', error)
      // Solo mostrar alerta después de varios intentos fallidos
      if (reconnectAttempts > 2) {
        addAlert('Problemas de conexión persistentes', 'warning')
      }
    })

    socket.on('initial-dashboard-data', (data: DashboardData) => {
      console.log('📊 Datos iniciales recibidos por WebSocket:', data)
      setDashboardData(data)
    })

    // ✅ EVENTO DE NUEVO VOTO MEJORADO - SIN ALERTAS EN BUCLE
    socket.on('new-vote', (data: { 
      electionId: number
      voterName: string
      candidateName: string
      timestamp: string
      method: string
      updatedStats?: any
    }) => {
      console.log('🗳️ Nuevo voto recibido:', data)
      
      // Actualizar datos del dashboard
      setDashboardData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          elections: prev.elections.map(election => 
            election.id === data.electionId && data.updatedStats
              ? { ...election, estadisticas: data.updatedStats }
              : election
          ),
          recent_activity: [
            {
              id: Date.now(),
              votante_nombre: data.voterName,
              eleccion_titulo: `Elección ${data.electionId}`,
              candidato_nombre: data.candidateName,
              timestamp: data.timestamp,
              metodo_identificacion: data.method || 'qr'
            },
            ...prev.recent_activity.slice(0, 19)
          ]
        }
      })

      // Actualizar elección seleccionada si corresponde
      if (selectedElection?.id === data.electionId) {
        setSelectedElection(prev => {
          if (!prev || !data.updatedStats) return prev
          return { ...prev, estadisticas: data.updatedStats }
        })

        // Actualizar historial de votos
        updateVoteHistory()
      }

      // Solo mostrar toast, no alerta persistente para evitar spam
      toast.success(`🗳️ ${data.voterName}`, {
        duration: 2000,
        position: 'bottom-right'
      })
    })

    socket.on('global-stats-updated', (data: any) => {
      console.log('📈 Estadísticas globales actualizadas:', data)
      
      setDashboardData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          summary: data.summary,
          recent_activity: data.recent_activity || prev.recent_activity
        }
      })
    })

    socket.on('election-stats-updated', (data: any) => {
      console.log('📊 Estadísticas de elección actualizadas:', data)
      
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

      if (selectedElection?.id === data.electionId) {
        setSelectedElection(prev => 
          prev ? { ...prev, estadisticas: data.stats } : prev
        )
      }
    })

    socket.on('election-finalized', (data: any) => {
      console.log('🏁 Elección finalizada:', data)
      
      // Solo mostrar alerta si es una elección que estamos monitoreando
      setDashboardData(prev => {
        if (!prev) return prev
        
        const isRelevantElection = prev.elections.some(e => e.id === data.electionId)
        if (isRelevantElection) {
          addAlert(`Elección ${data.electionId} ha finalizado`, 'info')
        }
        
        return {
          ...prev,
          elections: prev.elections.map(election =>
            election.id === data.electionId
              ? { ...election, estado: 'finalizada' }
              : election
          )
        }
      })
    })

    socket.on('system-alert', (data: { message: string, type: string }) => {
      addAlert(data.message, data.type as any)
    })

    socket.on('error', (error: any) => {
      console.error('❌ Error del WebSocket:', error)
      addAlert(error.message || 'Error de conexión', 'error')
    })
  }

  // ✅ FUNCIÓN PARA AGREGAR ALERTAS - CORREGIDA
  const addAlert = (message: string, type: SystemAlert['type']) => {
    const newAlert: SystemAlert = {
      id: Date.now().toString(),
      message,
      type,
      time: new Date()
    }

    setAlerts(prev => {
      // Evitar duplicar alertas del mismo mensaje en los últimos 5 segundos
      const recentAlert = prev.find(alert => 
        alert.message === message && 
        Date.now() - new Date(alert.time).getTime() < 5000
      )
      
      if (recentAlert) {
        return prev // No agregar si ya existe una alerta similar reciente
      }
      
      return [...prev.slice(-4), newAlert]
    })

    // Mostrar toast solo para alertas importantes
    if (type === 'error') {
      toast.error(message)
    } else if (type === 'success' && message.includes('conectado')) {
      toast.success(message)
    }
    // No mostrar toast para alertas de nuevos votos para evitar spam

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id))
    }, 5000)
  }

  // ✅ FUNCIÓN PARA GENERAR HISTORIAL DE VOTOS
  const generateVoteHistory = (election: ElectionStats) => {
    const history: VoteHistoryEntry[] = []
    const currentVotes = election.estadisticas.total_votos
    const currentParticipation = election.estadisticas.participacion_porcentaje
    
    // Generar datos de las últimas 24 horas
    for (let i = 23; i >= 0; i--) {
      const time = new Date()
      time.setHours(time.getHours() - i)
      
      // Simular progresión de votos (más realista)
      const voteProgress = Math.max(0, Math.floor(currentVotes * (1 - i * 0.02)))
      const participationProgress = Math.max(0, currentParticipation * (1 - i * 0.02))
      
      history.push({
        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        votes: voteProgress,
        participation: participationProgress,
        label: `${time.getHours().toString().padStart(2, '0')}:00`
      })
    }
    
    setVoteHistory(history)
  }

  // ✅ FUNCIÓN PARA ACTUALIZAR HISTORIAL DE VOTOS - MEJORADA
  const updateVoteHistory = () => {
    if (!selectedElection) return

    const now = new Date()
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    setVoteHistory(prev => {
      // Evitar duplicados en el mismo minuto
      const existingIndex = prev.findIndex(entry => entry.time === timeLabel)
      
      const newEntry: VoteHistoryEntry = {
        time: timeLabel,
        votes: selectedElection.estadisticas.total_votos,
        participation: selectedElection.estadisticas.participacion_porcentaje
      }

      if (existingIndex >= 0) {
        // Actualizar entrada existente
        const updated = [...prev]
        updated[existingIndex] = newEntry
        return updated
      } else {
        // Agregar nueva entrada y mantener solo las últimas 24
        return [...prev.slice(-23), newEntry]
      }
    })
  }

  // ✅ FUNCIÓN PARA SELECCIONAR ELECCIÓN - SIN EFECTOS SECUNDARIOS
  const handleElectionSelect = (election: ElectionStats) => {
    setSelectedElection(election)
    generateVoteHistory(election)
    
    // Unirse a la sala de la elección en WebSocket solo si está conectado
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join-election-room', { electionId: election.id })
    }
  }

  // ✅ FUNCIONES DE UTILIDAD
  const formatPercentage = (value: number) => `${Math.round(value * 100) / 100}%`
  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  // ✅ FUNCIONES PARA FORMATEAR DATOS DE GRÁFICOS
  const formatDistributionData = (election: ElectionStats) => {
    if (!election.estadisticas.votos_por_candidato) return []
    
    return election.estadisticas.votos_por_candidato
      .filter(candidato => candidato.votos > 0)
      .map(candidato => ({
        name: candidato.candidato_nombre.length > 20 
          ? candidato.candidato_nombre.substring(0, 20) + '...'
          : candidato.candidato_nombre,
        value: candidato.votos,
        percentage: candidato.porcentaje,
        fullName: candidato.candidato_nombre
      }))
  }

  // ✅ COMPONENTE DE LOADING
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mb-6 mx-auto">
              <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargando Dashboard</h2>
            <p className="text-gray-600 mb-4">Sistema de Votaciones SENA</p>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {isConnected ? 'Conectado' : reconnectAttempts > 0 ? `Reconectando... (${reconnectAttempts})` : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ✅ COMPONENTE DE ERROR
  if (!dashboardData) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error cargando datos</h2>
            <p className="text-gray-600 mb-4">No se pudieron cargar los datos del dashboard</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ✅ COMPONENTE PRINCIPAL
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* ✅ HEADER */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BoltIcon className="w-8 h-8 text-teal-600 mr-3" />
                  Dashboard en Tiempo Real
                </h1>
                <p className="text-gray-600 mt-1">Monitoreo de votaciones activas</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center px-3 py-2 rounded-full ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {isConnected ? 'Conectado' : reconnectAttempts > 0 ? `Reconectando... (${reconnectAttempts})` : 'Desconectado'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ ESTADÍSTICAS GLOBALES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Elecciones Activas</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {dashboardData.summary.active_elections}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-teal-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Votos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.summary.total_votes.toLocaleString()}
                  </p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Votantes Habilitados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.summary.total_voters.toLocaleString()}
                  </p>
                </div>
                <EyeIcon className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Participación Global</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(dashboardData.summary.participation_rate)}
                  </p>
                </div>
                <TrophyIcon className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* ✅ LISTA DE ELECCIONES */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2 text-teal-600" />
                    Elecciones
                  </h3>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {dashboardData.elections.length === 0 ? (
                    <div className="p-6 text-center">
                      <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No hay elecciones disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {dashboardData.elections.map((election) => (
                        <motion.div
                          key={election.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedElection?.id === election.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleElectionSelect(election)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {election.titulo}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              election.estado === 'activa' 
                                ? 'bg-green-100 text-green-800'
                                : election.estado === 'finalizada'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {election.estado}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Participación:</span>
                              <span className="font-medium">
                                {formatPercentage(election.estadisticas.participacion_porcentaje)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Votos:</span>
                              <span className="font-medium">
                                {election.estadisticas.total_votos} / {election.estadisticas.total_votantes_habilitados}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, election.estadisticas.participacion_porcentaje)}%` }}
                            ></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ PANEL PRINCIPAL DE ESTADÍSTICAS */}
            <div className="lg:col-span-3 space-y-6">
              {selectedElection ? (
                <>
                  {/* Información de la elección seleccionada */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedElection.titulo}</h2>
                        <p className="text-gray-600">
                          {new Date(selectedElection.fecha_inicio).toLocaleDateString()} - {new Date(selectedElection.fecha_fin).toLocaleDateString()}
                        </p>
                        {selectedElection.tipo_eleccion && (
                          <p className="text-sm text-gray-500 mt-1">{selectedElection.tipo_eleccion}</p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-full font-medium ${
                        selectedElection.estado === 'activa' 
                          ? 'bg-green-100 text-green-800'
                          : selectedElection.estado === 'finalizada'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedElection.estado.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedElection.estadisticas.total_votos}
                        </p>
                        <p className="text-blue-600 font-medium">Votos Emitidos</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedElection.estadisticas.total_votantes_habilitados}
                        </p>
                        <p className="text-purple-600 font-medium">Votantes Habilitados</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercentage(selectedElection.estadisticas.participacion_porcentaje)}
                        </p>
                        <p className="text-green-600 font-medium">Participación</p>
                      </div>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tendencia de votos */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <SignalIcon className="w-5 h-5 mr-2 text-teal-600" />
                        Tendencia de Participación
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={voteHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="votes" 
                            stroke="#0F766E" 
                            strokeWidth={3}
                            dot={{ fill: '#0F766E', strokeWidth: 2, r: 4 }}
                            name="Votos"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="participation" 
                            stroke="#7C3AED" 
                            strokeWidth={3}
                            dot={{ fill: '#7C3AED', strokeWidth: 2, r: 4 }}
                            name="Participación %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Distribución de votos por candidato */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-2 text-teal-600" />
                        Distribución de Votos
                      </h3>
                      {selectedElection.estadisticas.votos_por_candidato.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={formatDistributionData(selectedElection)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percentage }) => 
                                `${name}: ${Math.round(percentage)}%`
                              }
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {formatDistributionData(selectedElection).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center">
                          <div className="text-center">
                            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No hay votos registrados aún</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resultados detallados */}
                  {selectedElection.estadisticas.votos_por_candidato.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-2 text-yellow-600" />
                        {selectedElection.estado === 'finalizada' ? 'Resultados Finales' : 'Resultados Actuales'}
                      </h3>
                      <div className="space-y-3">
                        {selectedElection.estadisticas.votos_por_candidato
                          .sort((a, b) => b.votos - a.votos)
                          .map((candidato, index) => (
                            <div key={candidato.candidato_id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                                  index === 0 ? 'bg-yellow-500' :
                                  index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{candidato.candidato_nombre}</p>
                                  <p className="text-sm text-gray-600">{candidato.votos} votos</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPercentage(candidato.porcentaje)}
                                </p>
                                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, candidato.porcentaje)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Actividad reciente de votación */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UsersIcon className="w-5 h-5 mr-2 text-teal-600" />
                      Actividad Reciente de Votación
                    </h3>
                    {dashboardData.recent_activity.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        <AnimatePresence>
                          {dashboardData.recent_activity.slice(0, 10).map((activity) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{activity.votante_nombre}</p>
                                  <p className="text-sm text-gray-600">
                                    Votó por: {activity.candidato_nombre}
                                  </p>
                                  <p className="text-xs text-gray-500">{activity.eleccion_titulo}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatTime(activity.timestamp)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {activity.metodo_identificacion === 'qr' ? 'QR SENA' : 
                                   activity.metodo_identificacion === 'manual' ? 'Manual' : 
                                   'Identificado'}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No hay actividad reciente</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Mensaje cuando no hay elección seleccionada */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <ChartBarIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecciona una Elección
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Elige una elección de la lista para ver estadísticas detalladas y monitoreo en tiempo real
                  </p>
                  {dashboardData.elections.length > 0 && (
                    <button
                      onClick={() => handleElectionSelect(dashboardData.elections[0])}
                      className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Ver Primera Elección
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de participación global */}
          {dashboardData.elections.length > 1 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-teal-600" />
                Participación por Elección
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.elections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="titulo" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    label={{ value: 'Participación (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [`${Math.round(value)}%`, 'Participación']}
                  />
                  <Bar 
                    dataKey="estadisticas.participacion_porcentaje" 
                    fill="#0F766E"
                    name="Participación (%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alertas del sistema */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
              {alerts.slice(-3).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.8, x: 100 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 100 }}
                  className={`p-4 rounded-lg shadow-lg max-w-sm ${
                    alert.type === 'error' ? 'bg-red-500 text-white' :
                    alert.type === 'warning' ? 'bg-yellow-500 text-white' :
                    alert.type === 'success' ? 'bg-green-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}
                >
                  <div className="flex items-center">
                    {alert.type === 'error' ? <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> :
                     alert.type === 'warning' ? <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> :
                     alert.type === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-2" /> :
                     <BoltIcon className="w-5 h-5 mr-2" />}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs opacity-75">{formatTime(alert.time.toISOString())}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Indicador de estado de conexión flotante */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-300 rounded-full mr-2 animate-pulse"></div>
              <div>
                <p className="font-medium">Conexión perdida</p>
                {reconnectAttempts > 0 && (
                  <p className="text-xs opacity-75">Reintentando... ({reconnectAttempts}/5)</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}

export default RealTimeDashboard