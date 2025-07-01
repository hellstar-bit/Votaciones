// frontend/src/services/api.ts - ARCHIVO COMPLETO ACTUALIZADO
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

// INTERFACES Y TIPOS
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
  permite_voto_blanco?: boolean
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

export interface VoteData {
  id_eleccion: number
  id_candidato?: number | null
  qr_code: string
}

export interface VoteResult {
  message: string
  hash_verificacion: string
  timestamp: string
}

export interface Candidate {
  id_candidato: number
  estado: 'pendiente' | 'validado' | 'rechazado'
  numero_lista: number
  votos_recibidos: number
  validado_por?: number
  validado_at?: string
  motivo_rechazo?: string
  persona: {
    id_persona: number
    numero_documento: string
    nombres: string
    apellidos: string
    nombreCompleto: string
    email: string
    telefono: string
  }
  eleccion?: {
    id_eleccion: number
    titulo: string
    estado: string
  }
}

export interface Aprendiz {
  id_persona: number
  numero_documento: string
  tipo_documento: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  email: string
  telefono: string
  jornada?: string
  ficha?: {
    id_ficha: number
    numero_ficha: string
    nombre_programa: string
    jornada: string
  }
  sede?: {
    id_sede: number
    nombre_sede: string
  }
  centro?: {
    id_centro: number
    nombre_centro: string
  }
}

export interface Ficha {
  id_ficha: number
  numero_ficha: string
  nombre_programa: string
  jornada: string
  fecha_inicio?: string
  fecha_fin?: string
  sede?: {
    id_sede: number
    nombre_sede: string
  }
  centro?: {
    id_centro: number
    nombre_centro: string
  }
}

// SERVICIOS DE API

// Dashboard API
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

// Elections API
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

  // Cancelar elección
  cancel: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/elections/${id}/cancel`)
    return response.data
  },

  // Eliminar elección (solo canceladas)
  delete: async (id: number): Promise<{ 
    message: string;
    details?: {
      votos_eliminados: number;
      candidatos_eliminados: number;
      votantes_eliminados: number;
    }
  }> => {
    const response = await api.delete(`/elections/${id}`)
    return response.data
  },

  // ✅ NUEVO: Verificar si se puede eliminar una elección
  canDelete: async (id: number): Promise<{
    canDelete: boolean;
    reason?: string;
    details?: any;
  }> => {
    const response = await api.get(`/elections/${id}/can-delete`)
    return response.data
  },
}

// Candidates API
export const candidatesApi = {
  // Obtener candidatos de una elección
  getByElection: async (electionId: number): Promise<Candidate[]> => {
    const response = await api.get(`/candidates/election/${electionId}`)
    return response.data
  },

  // Crear candidato (con soporte para candidatos manuales)
  create: async (data: { 
    id_eleccion: number; 
    numero_documento: string;
    numero_lista: number;
    // Campos opcionales para candidatos manuales
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
  }) => {
    const response = await api.post('/candidates', data)
    return response.data
  },

  // Validar candidato
  validate: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/candidates/${id}/validate`)
    return response.data
  },

  // Rechazar candidato
  reject: async (id: number, motivo?: string): Promise<{ message: string }> => {
    const body = motivo ? { motivo } : {}
    const response = await api.patch(`/candidates/${id}/reject`, body)
    return response.data
  },

  // Eliminar candidato
  remove: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/candidates/${id}`)
    return response.data
  },

  // Obtener candidato por ID
  getById: async (id: number): Promise<Candidate> => {
    const response = await api.get(`/candidates/${id}`)
    return response.data
  },
}

// Personas API
export const personasApi = {
  // Obtener todos los aprendices con filtros
  getAprendices: async (filters?: {
    ficha?: string;
    sede?: string;
    centro?: string;
    jornada?: string;
    search?: string;
  }): Promise<Aprendiz[]> => {
    const params = new URLSearchParams()
    if (filters?.ficha) params.append('ficha', filters.ficha)
    if (filters?.sede) params.append('sede', filters.sede)
    if (filters?.centro) params.append('centro', filters.centro)
    if (filters?.jornada) params.append('jornada', filters.jornada)
    if (filters?.search) params.append('search', filters.search)

    const response = await api.get(`/personas/aprendices?${params.toString()}`)
    return response.data
  },

  // Buscar persona por documento
  getByDocumento: async (documento: string): Promise<Aprendiz> => {
    const response = await api.get(`/personas/by-documento/${documento}`)
    return response.data
  },
}

// Fichas API
export const fichasApi = {
  // Obtener todas las fichas
  getAll: async (): Promise<Ficha[]> => {
    const response = await api.get('/fichas')
    return response.data
  },

  // Obtener fichas activas
  getActive: async (): Promise<Ficha[]> => {
    const response = await api.get('/fichas/active')
    return response.data
  },
}

// Votes API
export const votesApi = {
  // Emitir voto
  cast: async (data: VoteData): Promise<VoteResult> => {
    const response = await api.post('/votes/cast', data)
    return response.data
  },

  // Verificar voto por hash
  verify: async (hash: string): Promise<any> => {
    const response = await api.get(`/votes/verify/${hash}`)
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