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

// ✅ NUEVAS INTERFACES PARA EL DASHBOARD
export interface ElectionRealTimeStats {
  id: number
  titulo: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
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

export interface GlobalRealTimeStats {
  summary: {
    total_elections: number
    active_elections: number
    total_votes: number
    total_voters: number
    participation_rate: number
  }
  recent_activity: Array<{
    id: number
    votante_nombre: string
    eleccion_titulo: string
    candidato_nombre: string
    timestamp: string
    metodo_identificacion: string
  }>
}

export interface ElectionVoter {
  nombre: string
  documento: string
  ha_votado: boolean
  fecha_voto?: string
  ip_voto?: string
  dispositivo_voto?: string
}

export interface ElectionHourlyTrend {
  fecha: string
  hora: number
  votos: number
  timestamp: string
}

export interface ParticipationByLocation {
  location: string
  total_voters: number
  voted: number
  participation_rate: number
}

export interface FinalElectionResults {
  eleccion: {
    id: number
    titulo: string
    fecha_inicio: string
    fecha_fin: string
  }
  estadisticas: {
    total_votantes_habilitados: number
    total_votos_emitidos: number
    participacion_porcentaje: number
    votos_blanco: number
  }
  resultados: Array<{
    posicion: number
    candidato_id: number
    candidato_nombre: string
    votos: number
    porcentaje: number
    es_ganador: boolean
  }>
}

// ✅ DASHBOARD API ACTUALIZADA
export const dashboardApi = {
  // Obtener estadísticas generales del dashboard
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // ✅ NUEVO: Obtener elecciones con estadísticas en tiempo real
  getRealTimeElections: async (): Promise<ElectionRealTimeStats[]> => {
    const response = await api.get('/dashboard/real-time/elections')
    return response.data
  },

  // ✅ NUEVO: Obtener estadísticas globales en tiempo real
  getGlobalStats: async (): Promise<GlobalRealTimeStats> => {
    const response = await api.get('/dashboard/real-time/global-stats')
    return response.data
  },

  // ✅ NUEVO: Obtener lista de votantes de una elección
  getElectionVoters: async (electionId: number): Promise<ElectionVoter[]> => {
    const response = await api.get(`/dashboard/election/${electionId}/voters`)
    return response.data
  },

  // ✅ NUEVO: Obtener tendencias por hora de una elección
  getElectionHourlyTrends: async (electionId: number): Promise<ElectionHourlyTrend[]> => {
    const response = await api.get(`/dashboard/election/${electionId}/hourly-trends`)
    return response.data
  },

  // ✅ NUEVO: Obtener participación por ubicación
  getParticipationByLocation: async (electionId: number): Promise<ParticipationByLocation[]> => {
    const response = await api.get(`/dashboard/election/${electionId}/participation-by-location`)
    return response.data
  },

  // ✅ NUEVO: Obtener resultados finales
  getFinalResults: async (electionId: number): Promise<FinalElectionResults> => {
    const response = await api.get(`/dashboard/election/${electionId}/final-results`)
    return response.data
  },

  // ✅ Mantener métodos heredados para compatibilidad
  getElectionTrends: async (electionId: number) => {
    const response = await api.get(`/dashboard/election/${electionId}/trends`)
    return response.data
  },

  getParticipation: async (electionId: number) => {
    const response = await api.get(`/dashboard/election/${electionId}/participation`)
    return response.data
  },
}
// INTERFACES Y TIPOS
export interface DashboardStats {
  // El backend devuelve las propiedades directamente, no anidadas en summary
  total_elections: number
  active_elections: number
  total_votes: number
  total_voters: number
  participation_rate: number
  elections: Election[]
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
    foto_url?: string
  }
  eleccion?: {
    id_eleccion: number
    titulo: string
    estado: string
  }
}

// 🔧 INTERFACES DE IMPORTACIÓN ACTUALIZADAS
export interface ImportOptions {
  validateFichas?: boolean
  createMissingFichas?: boolean
  updateExisting?: boolean        // 🔧 NUEVA
  skipDuplicates?: boolean       // 🔧 NUEVA  
  flexibleValidation?: boolean   // 🔧 NUEVA
  dryRun?: boolean              // 🔧 NUEVA
  batchSize?: number            // 🔧 NUEVA
}

export interface ImportResult {
  success: boolean
  summary: ImportSummary
  errors: ImportError[]
  warnings: ImportWarning[]
  importedRecords: number
  totalRecords: number
  executionTime: number
  
  // 🔧 PROPIEDADES NUEVAS QUE FALTAN
  duplicatesSkipped?: DuplicateRecord[]
  recordsUpdated?: number
  warningsCount?: number
  validationMode?: 'strict' | 'flexible'
}

export interface ImportSummary {
  totalRegistros: number
  programas: any
  totalFiles: number
  totalSheets: number
  totalRecords: number
  importedRecords: number
  duplicateRecords: number
  errorRecords: number
  fichasProcessed: string[]
  programasFound: string[]
  
  // 🔧 PROPIEDADES PARA COMPATIBILIDAD CON PREVIEW
  totalHojas?: number           
  totalEstudiantes?: number     
  totalErrores?: number         
  fichas?: string[]            
  
  // 🔧 PROPIEDADES NUEVAS
  updatedRecords?: number
  skippedRecords?: number
  createdFichas?: string[]
  processingTime?: number
}

export interface ImportError {
  row: number
  sheet: string
  field: string
  value: any
  message: string
  severity: 'error' | 'warning'
  
  // 🔧 CONTEXTO ADICIONAL
  originalValue?: any
  suggestedFix?: string
  errorCode?: string
}

export interface ImportWarning {
  row: number
  sheet: string
  message: string
  data: any
  
  // 🔧 TIPO DE WARNING
  type?: 'validation' | 'data_cleanup' | 'mapping' | 'duplicate'
  resolved?: boolean
}

// 🔧 NUEVA INTERFAZ PARA DUPLICADOS
export interface DuplicateRecord {
  documento: string
  nombre: string
  razon: string
  filaOriginal?: number
  datosExistentes?: any
  datosNuevos?: any
}

export interface ExcelPreviewResult {
  success: boolean
  preview: PreviewRecord[]      // 🔧 CAMBIO: De SheetPreview[] a PreviewRecord[]
  resumen: ImportSummary
  errores?: ImportError[]
  advertencias?: ImportWarning[]
}

// 🔧 NUEVA INTERFAZ PARA PREVIEW RECORDS (con 'documento')
export interface PreviewRecord {
  documento: string            // 🔧 ESTO RESUELVE EL ERROR
  nombre: string
  email: string
  telefono: string
  tipoDocumento?: string
  estado?: string
  ficha?: string
  programa?: string
}

// 🔧 MANTENER SheetPreview PARA COMPATIBILIDAD
export interface SheetPreview {
  numeroFicha: string
  nombrePrograma: string
  totalEstudiantes: number
  erroresEncontrados: number
  muestra: StudentSample[]
  errores: ImportError[]
}

export interface StudentSample {
  documento: string
  nombre: string
  email: string
  telefono: string
}

export interface ImportHistoryItem {
  id: number
  filename: string
  originalFilename?: string
  fecha: string | Date
  usuario: string
  registros_importados: number
  registros_totales: number
  estado: string
  tipoImportacion?: string
  executionTime?: number
  opciones?: ImportOptions
  createdAt?: string | Date
}

// 🔧 NUEVAS INTERFACES PARA ENDPOINTS ADICIONALES
export interface FileValidationResponse {
  valid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: FileInfo
  suggestions?: string[]
}

export interface FileInfo {
  name: string
  size: number
  type: string
  extension?: string
  sheets?: string[]
  encoding?: string
}

export interface DocumentTypeStats {
  total: number
  byType: DocumentTypeStat[]
  timestamp: Date
  error?: string
}

export interface DocumentTypeStat {
  tipo: string
  cantidad: number
  porcentaje: string
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
  foto_url?: string
  estado?: string
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
  fecha_nacimiento?: string
  direccion?: string
  ciudad?: string
  genero?: string
  nivel_educativo?: string
  fecha_ingreso_ficha?: string
  fecha_fin_formacion?: string
  telefono_emergencia?: string
  contacto_emergencia?: string
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

// 🔧 API DE IMPORTACIÓN ACTUALIZADA
export const importApi = {
  // Preview de importación Excel
  previewExcel: async (file: File): Promise<ExcelPreviewResult> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/import/excel/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 🔧 IMPORTAR CON OPCIONES EXTENDIDAS
  importExcel: async (
    file: File, 
    options: ImportOptions = {}
  ): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // 🔧 AGREGAR TODAS LAS OPCIONES AL BODY (no como query params)
    Object.keys(options).forEach(key => {
      if (options[key as keyof ImportOptions] !== undefined) {
        formData.append(key, String(options[key as keyof ImportOptions]))
      }
    })

    const response = await api.post('/import/excel/aprendices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Obtener historial de importaciones
  getImportHistory: async (): Promise<ImportHistoryItem[]> => {
    const response = await api.get('/import/history')
    return response.data
  },

  // Descargar plantilla Excel
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/import/templates/excel', {
      responseType: 'blob',
    })
    return response.data
  },

  // 🔧 NUEVO: Validar archivo sin importar
  validateFile: async (file: File): Promise<FileValidationResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/import/excel/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 🔧 NUEVO: Obtener estadísticas de tipos de documento
  getDocumentTypeStats: async (): Promise<DocumentTypeStats> => {
    const response = await api.get('/import/stats/document-types')
    return response.data
  }
}

// SERVICIOS DE API

// Dashboard AP

// Elections API
export const electionsApi = {
  // Obtener todas las elecciones
  getAll: async (): Promise<Election[]> => {
    const response = await api.get('/elections')
    return response.data
  },

  getById: async (id: number): Promise<Election> => {
    const response = await api.get(`/elections/${id}`)
    return response.data
  },

  // Obtener elecciones activas
  getActive: async (): Promise<Election[]> => {
    const response = await api.get('/elections/active')
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

  // Verificar si se puede eliminar una elección
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

  // Actualizar datos de candidato
  update: async (id: number, data: {
    numero_lista?: number;
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
  }): Promise<Candidate> => {
    const response = await api.patch(`/candidates/${id}`, data)
    return response.data
  },

  // Actualizar estado con motivo
  updateStatus: async (id: number, estado: string, motivo?: string): Promise<{ message: string }> => {
    const body = motivo ? { estado, motivo } : { estado }
    const response = await api.patch(`/candidates/${id}/status`, body)
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

  // Alias para compatibilidad
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/candidates/${id}`)
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
export const handleApiError = (error: any, _p0?: string): string => {
  console.error('🚨 API Error:', error)
  
  // Si hay respuesta del servidor
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  // Si hay un mensaje de error genérico
  if (error.message) {
    return error.message
  }
  
  // Error de red
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.'
  }
  
  // Error por código de estado
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Datos inválidos. Verifica la información enviada.'
      case 401:
        return 'No autorizado. Por favor, inicia sesión nuevamente.'
      case 403:
        return 'No tienes permisos para realizar esta acción.'
      case 404:
        return 'Recurso no encontrado.'
      case 409:
        return 'Conflicto. El recurso ya existe o está en uso.'
      case 422:
        return 'Datos no válidos. Verifica los campos requeridos.'
      case 500:
        return 'Error interno del servidor. Intenta nuevamente.'
      default:
        return `Error del servidor (${error.response.status})`
    }
  }
  
  // Fallback
  return 'Ha ocurrido un error inesperado'
}

export default api