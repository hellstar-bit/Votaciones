// CreateElectionModal.tsx - Con fichas dinámicas desde la base de datos
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, fichasApi, handleApiError, type CreateElectionData, type Ficha } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface CreateElectionModalProps {
  isOpen: boolean
  onClose: () => void
  onElectionCreated: () => void
}

interface FormData {
  titulo: string
  descripcion: string
  tipo_eleccion: string
  fecha_inicio: string
  hora_inicio: string
  fecha_fin: string
  hora_fin: string
  jornadas: string[]
  numero_ficha: string
}

interface FormErrors {
  titulo?: string
  tipo_eleccion?: string
  fecha_inicio?: string
  hora_inicio?: string
  fecha_fin?: string
  hora_fin?: string
  jornadas?: string
  numero_ficha?: string
  general?: string
}

const CreateElectionModal = ({ isOpen, onClose, onElectionCreated }: CreateElectionModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descripcion: '',
    tipo_eleccion: '',
    fecha_inicio: '',
    hora_inicio: '06:00',
    fecha_fin: '',
    hora_fin: '23:59',
    jornadas: [], // ✅ CORREGIDO: Vacío por defecto
    numero_ficha: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fichasDisponibles, setFichasDisponibles] = useState<Ficha[]>([])
  const [loadingFichas, setLoadingFichas] = useState(false)

  // Cargar fichas disponibles cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      loadFichasDisponibles()
    }
  }, [isOpen])

  const loadFichasDisponibles = async () => {
    try {
      setLoadingFichas(true)
      console.log('🔍 Cargando fichas disponibles...')
      
      // Cargar todas las fichas de la base de datos
      const fichas = await fichasApi.getAll()
      console.log('✅ Fichas cargadas:', fichas)
      
      setFichasDisponibles(fichas)
    } catch (error) {
      console.error('❌ Error cargando fichas:', error)
      toast.error('Error cargando fichas disponibles')
    } finally {
      setLoadingFichas(false)
    }
  }

  // Tipos de elección disponibles
  const tiposEleccion = [
    { 
      value: 'VOCERO_FICHA', 
      label: 'Vocero de Ficha', 
      nivel: 'FICHA',
      icon: AcademicCapIcon,
      description: 'Elección para representante de una ficha específica',
      features: ['Enfoque específico', 'Comunidad cerrada', 'Representación directa']
    },
    { 
      value: 'REPRESENTANTE_CENTRO', 
      label: 'Representante de Centro', 
      nivel: 'CENTRO',
      icon: UserGroupIcon,
      description: 'Representación a nivel de centro de formación',
      features: ['Máximo alcance', 'Liderazgo institucional', 'Representación oficial']
    }
  ]

  // ✅ JORNADAS ACTUALIZADAS - SOLO 2 JORNADAS PARA REPRESENTANTE_CENTRO
  const jornadas = [
  { value: 'nocturna', label: 'Jornada Nocturna', color: 'bg-purple-100 text-purple-800' },
  { value: '24_horas', label: 'Jornada 24 Horas', color: 'bg-orange-100 text-orange-800' },
  { value: 'mixta', label: 'Jornada Mixta', color: 'bg-blue-100 text-blue-800' },
]

  // Determinar si mostrar campos específicos
  const shouldShowFichaInput = formData.tipo_eleccion === 'VOCERO_FICHA'
  const shouldShowJornadas = formData.tipo_eleccion === 'REPRESENTANTE_CENTRO'

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // ✅ NUEVA FUNCIÓN: Manejar cambio de tipo de elección
  const handleTipoEleccionChange = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      tipo_eleccion: tipo,
      // Si es Representante de Centro, limpiar jornadas para que el usuario elija
      jornadas: tipo === 'REPRESENTANTE_CENTRO' ? [] : prev.jornadas
    }))
  }

  // Manejar selección de jornadas
  const handleJornadaToggle = (jornada: string) => {
    const newJornadas = formData.jornadas.includes(jornada)
      ? formData.jornadas.filter(j => j !== jornada)
      : [...formData.jornadas, jornada]
    
    handleInputChange('jornadas', newJornadas)
  }

  // Validar si existe la ficha
  const validateFichaExists = (numeroFicha: string): boolean => {
    const fichaExists = fichasDisponibles.some(f => f.numero_ficha === numeroFicha)
    
    if (!fichaExists) {
      const fichasValidas = fichasDisponibles.map(f => f.numero_ficha).slice(0, 5)
      setErrors(prev => ({ 
        ...prev, 
        numero_ficha: `La ficha ${numeroFicha} no existe. Fichas válidas: ${fichasValidas.join(', ')}${fichasDisponibles.length > 5 ? '...' : ''}` 
      }))
      return false
    }
    return true
  }

  // ✅ VALIDACIÓN MEJORADA
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    }

    if (!formData.tipo_eleccion) {
      newErrors.tipo_eleccion = 'Debe seleccionar un tipo de elección'
    }

    // Validación específica para cada tipo
    if (formData.tipo_eleccion === 'VOCERO_FICHA') {
      if (!formData.numero_ficha.trim()) {
        newErrors.numero_ficha = 'El número de ficha es requerido para Vocero de Ficha'
      }
    }

    if (formData.tipo_eleccion === 'REPRESENTANTE_CENTRO') {
    if (formData.jornadas.length === 0) {
      newErrors.jornadas = 'Debe seleccionar al menos una jornada (Nocturna, 24 Horas o Mixta)'
    }
  }

    // Validaciones de fecha y hora...
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida'
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida'
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida'
    }

    if (!formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin es requerida'
    }

    return newErrors
  }

  // Función helper para obtener ID de ficha por número
  const getFichaIdFromNumero = (numeroFicha: string): number | undefined => {
    const ficha = fichasDisponibles.find(f => f.numero_ficha === numeroFicha)
    return ficha?.id_ficha
  }
  const getJornadaDisplayName = (jornada: string): string => {
  const mapping = {
    'nocturna': 'Nocturna',
    '24_horas': '24 Horas',
    'mixta': 'Mixta'
  }
  return mapping[jornada as keyof typeof mapping] || jornada
}



  // ✅ FUNCIÓN HANDLESUBMIT CORREGIDA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar formulario
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Para VOCERO_FICHA, validar ficha antes de crear
      if (shouldShowFichaInput) {
        const isValidFicha = validateFichaExists(formData.numero_ficha.trim())
        if (!isValidFicha) {
          setIsSubmitting(false)
          return
        }
      }

      // ✅ CORRECCIÓN: Para Representante de Centro
      if (formData.tipo_eleccion === 'REPRESENTANTE_CENTRO') {
  // Si solo hay una jornada seleccionada, crear una sola elección
  if (formData.jornadas.length === 1) {
    const jornada = formData.jornadas[0]
    const electionData: CreateElectionData = {
      titulo: formData.titulo, // ✅ Sin sufijo de jornada cuando es solo una
      descripcion: formData.descripcion || `Elección de ${formData.titulo}`,
      tipo_eleccion: formData.tipo_eleccion,
      fecha_inicio: `${formData.fecha_inicio}T${formData.hora_inicio}:00`,
      fecha_fin: `${formData.fecha_fin}T${formData.hora_fin}:00`,
      jornada,
    }
    
    await electionsApi.create(electionData)
    toast.success(`Elección creada exitosamente para jornada ${getJornadaDisplayName(jornada)}`)
    
  } else {
    // Si hay múltiples jornadas, crear una elección por cada una
    for (const jornada of formData.jornadas) {
      const electionData: CreateElectionData = {
        titulo: `${formData.titulo} - ${getJornadaDisplayName(jornada)}`,
        descripcion: formData.descripcion || `Elección de ${formData.titulo} para jornada ${getJornadaDisplayName(jornada)}`,
        tipo_eleccion: formData.tipo_eleccion,
        fecha_inicio: `${formData.fecha_inicio}T${formData.hora_inicio}:00`,
        fecha_fin: `${formData.fecha_fin}T${formData.hora_fin}:00`,
        jornada,
      }
      
      await electionsApi.create(electionData)
    }
    
    toast.success(`Elecciones creadas exitosamente para ${formData.jornadas.length} jornadas`)
  }
} else {
        // Para otros tipos, crear una sola elección
        const electionData: CreateElectionData = {
          titulo: formData.titulo,
          descripcion: formData.descripcion || `Elección de ${formData.titulo}`,
          tipo_eleccion: formData.tipo_eleccion,
          fecha_inicio: `${formData.fecha_inicio}T${formData.hora_inicio}:00`,
          fecha_fin: `${formData.fecha_fin}T${formData.hora_fin}:00`,
          ...(shouldShowFichaInput && { 
            id_ficha: getFichaIdFromNumero(formData.numero_ficha.trim()) 
          })
        }
        
        await electionsApi.create(electionData)
        toast.success('Elección creada exitosamente')
      }

      // Limpiar formulario y cerrar modal
      resetForm()
      onClose()
      onElectionCreated?.()
      
    } catch (error) {
      console.error('❌ Error creando elección:', error)
      handleApiError(error, 'Error creando elección')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ RESETEAR FORMULARIO CORREGIDO
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo_eleccion: '',
      fecha_inicio: '',
      hora_inicio: '06:00',
      fecha_fin: '',
      hora_fin: '23:59',
      jornadas: [], // ✅ Vacío por defecto
      numero_ficha: ''
    })
    setErrors({})
  }

  // Cerrar modal
  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      resetForm()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-sena-600 to-sena-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                <SparklesIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Nueva Elección</h2>
                <p className="text-sena-100 text-sm">Configura una nueva elección democrática</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        {/* Contenido con scroll */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Error general */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-700 text-sm font-medium">{errors.general}</p>
                </div>
              </motion.div>
            )}

            {/* Información básica */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-sena-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Información Básica</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <Input
                    label="Título de la Elección *"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Ej: Elección Vocero de Ficha 2024"
                    error={errors.titulo}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción adicional sobre la elección..."
                    disabled={isSubmitting}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sena-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de elección */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="w-6 h-6 text-sena-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Tipo de Elección</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {tiposEleccion.map((tipo) => {
                  const Icon = tipo.icon
                  return (
                    <motion.div
                      key={tipo.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                        formData.tipo_eleccion === tipo.value
                          ? 'border-sena-500 bg-sena-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTipoEleccionChange(tipo.value)} 
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                          formData.tipo_eleccion === tipo.value ? 'bg-sena-500' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            formData.tipo_eleccion === tipo.value ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{tipo.label}</h4>
                        <p className="text-sm text-gray-600 mb-3">{tipo.description}</p>
                        <div className="space-y-1">
                          {tipo.features.map((feature, index) => (
                            <span key={index} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full mr-1">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {formData.tipo_eleccion === tipo.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-sena-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              
              {errors.tipo_eleccion && (
                <p className="text-red-600 text-sm mt-2">{errors.tipo_eleccion}</p>
              )}
            </div>

            {/* Configuración específica por tipo */}
            <AnimatePresence>
              {/* Input de ficha para VOCERO_FICHA */}
              {shouldShowFichaInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center mb-4">
                    <AcademicCapIcon className="w-6 h-6 text-sena-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">Información de la Ficha</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Número de Ficha *
                    </label>
                    <Input
                      type="text"
                      value={formData.numero_ficha}
                      onChange={(e) => handleInputChange('numero_ficha', e.target.value)}
                      placeholder="Ej: 2999518"
                      error={errors.numero_ficha}
                      disabled={isSubmitting}
                      className="text-lg font-mono"
                    />
                    <p className="mt-3 text-sm text-gray-600">
                      Ingrese el número de la ficha para la cual se realizará esta elección.
                    </p>
                    
                    {/* Fichas disponibles dinámicas */}
                    <div className="mt-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">Fichas Disponibles:</p>
                        {loadingFichas && (
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                            Cargando...
                          </div>
                        )}
                      </div>
                      
                      {fichasDisponibles.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {fichasDisponibles.map((ficha) => (
                            <motion.button
                              key={ficha.numero_ficha}
                              type="button"
                              onClick={() => handleInputChange('numero_ficha', ficha.numero_ficha)}
                              disabled={isSubmitting}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-left"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title={`${ficha.nombre_programa} - ${ficha.jornada}`}
                            >
                              <div className="font-semibold">{ficha.numero_ficha}</div>
                              <div className="text-xs text-gray-500 truncate">{ficha.nombre_programa}</div>
                            </motion.button>
                          ))}
                        </div>
                      ) : !loadingFichas ? (
                        <div className="text-center py-4">
                          <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No se encontraron fichas disponibles</p>
                          <button
                            type="button"
                            onClick={loadFichasDisponibles}
                            className="text-xs text-sena-600 hover:text-sena-800 mt-1 underline"
                          >
                            Recargar fichas
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ✅ SELECTOR DE JORNADAS MEJORADO PARA REPRESENTANTE_CENTRO */}
              {shouldShowJornadas && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center mb-4">
                    <ClockIcon className="w-6 h-6 text-sena-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">Jornadas</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-700">
                        Selecciona las jornadas para las cuales se creará la elección (Nocturna, 24 Horas y/o Mixta):
                      </p>
                      
                      {/* ✅ INDICADOR: Cuántas elecciones se van a crear */}
                      {formData.jornadas.length > 0 && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          formData.jornadas.length === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {formData.jornadas.length === 1 ? '1 elección' : `${formData.jornadas.length} elecciones`}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jornadas.map((jornada) => (
                        <motion.button
                          key={jornada.value}
                          type="button"
                          onClick={() => handleJornadaToggle(jornada.value)}
                          disabled={isSubmitting}
                          className={`p-4 rounded-xl border-2 transition-all relative ${
                            formData.jornadas.includes(jornada.value)
                              ? 'border-sena-500 bg-sena-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${jornada.color} mb-2`}>
                              {jornada.label}
                            </span>
                            
                            {formData.jornadas.includes(jornada.value) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-sena-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    {errors.jornadas && (
                      <p className="text-red-600 text-sm mt-2">{errors.jornadas}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fechas y horarios */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="w-6 h-6 text-sena-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Fechas y Horarios</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Fecha de Inicio *"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                    error={errors.fecha_inicio}
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Hora de Inicio *"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                    error={errors.hora_inicio}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Fecha de Fin *"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                    error={errors.fecha_fin}
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Hora de Fin *"
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => handleInputChange('hora_fin', e.target.value)}
                    error={errors.hora_fin}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Crear Elección
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default CreateElectionModal