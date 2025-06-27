// frontend/src/services/api.ts
import axios from 'axios'

// Configuración base de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Función para obtener el token de manera segura
const getAuthToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state?.token || null
    }
  } catch (error) {
    console.error('Error obteniendo token:', error)
  }
  return null
}

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    console.log('🔑 Token encontrado:', !!token)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    console.log('📤 Headers:', config.headers)
    
    return config
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url)
    return response
  },
  async (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data)
    
    if (error.response?.status === 401) {
      console.log('🚨 Token expirado, limpiando auth storage')
      // Limpiar storage y redirigir
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Tipos de datos
export interface DashboardStats {
  summary: {
    total_elections: number
    active_elections: number
    total_votes: number
    total_voters: number
    participation_rate: number
  }
  recent_activity: Array<{
    id: number
    election: string
    candidate: string
    timestamp: string
  }>
}

export interface Election {
  id_eleccion: number
  titulo: string
  descripcion: string
  estado: 'configuracion' | 'activa' | 'finalizada' | 'cancelada'
  fecha_inicio: string
  fecha_fin: string
  total_votantes_habilitados: number
  total_votos_emitidos: number
  jornada?: string
  tipoEleccion: {
    id_tipo_eleccion: number
    nombre_tipo: string
    nivel_aplicacion: string
  }
  centro?: { nombre_centro: string }
  sede?: { nombre_sede: string }
  ficha?: { numero_ficha: string }
}

export interface ElectionStats {
  eleccion: {
    id: number
    titulo: string
    estado: string
    fecha_inicio: string
    fecha_fin: string
  }
  estadisticas: {
    total_votantes: number
    total_votos: number
    votos_blanco: number
    porcentaje_participacion: number
  }
  candidatos: Array<{
    id: number
    nombre: string
    votos: number
    porcentaje: number
  }>
}

export interface CreateElectionData {
  titulo: string
  descripcion: string
  tipo_eleccion: string
  fecha_inicio: string
  fecha_fin: string
  jornada?: string
  id_centro?: number
  id_sede?: number
  id_ficha?: number
}

export interface Candidate {
  id_candidato: number
  estado: 'pendiente' | 'validado' | 'rechazado'
  votos_recibidos: number
  persona: {
    id_persona: number
    numero_documento: string
    nombres: string
    apellidos: string
    nombreCompleto: string
  }
}

// Servicios de API
export const dashboardApi = {
  // Obtener estadísticas del dashboard
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // Obtener tendencias de una elección
  getElectionTrends: async (electionId: number) => {
    const response = await api.get(`/dashboard/election/${electionId}/trends`)
    return response.data
  },

  // Obtener participación por ubicación
  getParticipationByLocation: async (electionId: number) => {
    const response = await api.get(`/dashboard/election/${electionId}/participation`)
    return response.data
  },
}

export const electionsApi = {
  // Obtener todas las elecciones
  getAll: async (): Promise<Election[]> => {
    const response = await api.get('/elections')
    return response.data
  },

  // Obtener elecciones activas
  getActive: async (): Promise<Election[]> => {
    const response = await api.get('/elections/active')
    return response.data
  },

  // Obtener una elección específica
  getById: async (id: number): Promise<Election> => {
    const response = await api.get(`/elections/${id}`)
    return response.data
  },

  // Obtener estadísticas de una elección
  getStats: async (id: number): Promise<ElectionStats> => {
    const response = await api.get(`/elections/${id}/stats`)
    return response.data
  },

  // Crear nueva elección
  create: async (data: CreateElectionData): Promise<Election> => {
    const response = await api.post('/elections', data)
    return response.data
  },

  // Activar elección
  activate: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/elections/${id}/activate`)
    return response.data
  },

  // Finalizar elección
  finalize: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/elections/${id}/finalize`)
    return response.data
  },
}

export const candidatesApi = {
  // Obtener candidatos de una elección
  getByElection: async (electionId: number): Promise<Candidate[]> => {
    const response = await api.get(`/candidates/election/${electionId}`)
    return response.data
  },

  // Crear candidato
  create: async (data: { id_eleccion: number; id_persona: number }) => {
    const response = await api.post('/candidates', data)
    return response.data
  },

  // Validar candidato
  validate: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/candidates/${id}/validate`)
    return response.data
  },
}

// Manejo de errores específicos
export const handleApiError = (error: any) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'Ha ocurrido un error inesperado'
}

export default api