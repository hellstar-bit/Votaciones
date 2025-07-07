// CreateElectionModal.tsx - Diseño premium corregido
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, handleApiError, type CreateElectionData } from '../../services/api'
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
    jornadas: ['mixta', 'nocturna', 'madrugada'],
    numero_ficha: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tipos de elección disponibles con mejor diseño
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
      value: 'LIDER_SEDE', 
      label: 'Líder de Sede', 
      nivel: 'SEDE',
      icon: BuildingOfficeIcon,
      description: 'Liderazgo a nivel de sede educativa',
      features: ['Alcance medio', 'Múltiples fichas', 'Coordinación inter-grupos']
    },
    { 
      value: 'REPRESENTANTE_CENTRO', 
      label: 'Representante de Centro', 
      nivel: 'CENTRO',
      icon: UserGroupIcon,
      description: 'Máximo nivel de representación estudiantil',
      features: ['Alcance amplio', 'Todas las sedes', 'Liderazgo institucional']
    },
  ]

  // Jornadas disponibles con diseño mejorado
  const jornadasDisponibles = [
    { 
      value: 'mixta', 
      label: 'Mixta', 
      subtitle: 'Diurna',
      horario: '6:00 AM - 6:00 PM',
      color: 'bg-gradient-to-br from-yellow-400 to-orange-500',
      textColor: 'text-white'
    },
    { 
      value: 'nocturna', 
      label: 'Nocturna', 
      subtitle: 'Vespertina',
      horario: '6:00 PM - 10:00 PM',
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      textColor: 'text-white'
    },
    { 
      value: 'madrugada', 
      label: 'Madrugada', 
      subtitle: 'Extendida',
      horario: '10:00 PM - 11:59 PM',
      color: 'bg-gradient-to-br from-slate-600 to-slate-800',
      textColor: 'text-white'
    },
  ]

  // Verificar si debe mostrar campos específicos
  const shouldShowFichaInput = formData.tipo_eleccion === 'VOCERO_FICHA'
  const shouldShowJornadas = formData.tipo_eleccion === 'REPRESENTANTE_CENTRO'

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar número de ficha si cambia el tipo
    if (field === 'tipo_eleccion' && value !== 'VOCERO_FICHA') {
      setFormData(prev => ({
        ...prev,
        numero_ficha: ''
      }))
    }

    // Limpiar errores
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  // Manejar cambio de jornadas
  const handleJornadaChange = (jornada: string, checked: boolean) => {
    const newJornadas = checked 
      ? [...formData.jornadas, jornada]
      : formData.jornadas.filter(j => j !== jornada)

    handleInputChange('jornadas', newJornadas)

    // Sugerir horarios automáticamente
    if (checked && newJornadas.length === 1) {
      switch (jornada) {
        case 'mixta':
          setFormData(prev => ({ ...prev, hora_inicio: '06:00', hora_fin: '18:00' }))
          break
        case 'nocturna':
          setFormData(prev => ({ ...prev, hora_inicio: '18:00', hora_fin: '22:00' }))
          break
        case 'madrugada':
          setFormData(prev => ({ ...prev, hora_inicio: '22:00', hora_fin: '23:59' }))
          break
      }
    } else if (newJornadas.length > 1) {
      setFormData(prev => ({ ...prev, hora_inicio: '06:00', hora_fin: '23:59' }))
    }
  }

  // Obtener fecha mínima
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Obtener hora mínima
  const getMinTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Mapeo de fichas a IDs
  const getFichaIdFromNumero = (numero: string): number => {
    const fichasMap = {
      '3037689': 1,
      '3037399': 2, 
      '3070126': 3,
      '2999518': 4
    }
    
    const fichaId = fichasMap[numero as keyof typeof fichasMap]
    if (!fichaId) {
      console.error('❌ No se encontró ID para la ficha:', numero)
      throw new Error(`Ficha ${numero} no tiene ID asignado`)
    }
    
    console.log('✅ Ficha mapeada:', numero, '→', fichaId)
    return fichaId
  }

  // Validar que la ficha existe
  const validateFichaExists = (numeroFicha: string): boolean => {
    const fichasValidas = ['3037689', '3037399', '3070126', '2999518']
    
    if (!fichasValidas.includes(numeroFicha)) {
      setErrors(prev => ({ 
        ...prev, 
        numero_ficha: `La ficha ${numeroFicha} no existe. Fichas válidas: ${fichasValidas.join(', ')}` 
      }))
      return false
    }
    return true
  }

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    }

    if (!formData.tipo_eleccion) {
      newErrors.tipo_eleccion = 'Debe seleccionar un tipo de elección'
    }

    // Validar número de ficha para VOCERO_FICHA
    if (shouldShowFichaInput) {
      if (!formData.numero_ficha.trim()) {
        newErrors.numero_ficha = 'El número de ficha es requerido para este tipo de elección'
      } else if (!/^\d+$/.test(formData.numero_ficha.trim())) {
        newErrors.numero_ficha = 'El número de ficha debe contener solo números'
      } else if (!validateFichaExists(formData.numero_ficha.trim())) {
        // El error ya se establece en validateFichaExists
      }
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida'
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida'
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida'
    }

    if (!formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin es requerida'
    }

    if (shouldShowJornadas && formData.jornadas.length === 0) {
      newErrors.jornadas = 'Debe seleccionar al menos una jornada'
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      const fechaInicio = new Date(`${formData.fecha_inicio}T${formData.hora_inicio}`)
      const fechaFin = new Date(`${formData.fecha_fin}T${formData.hora_fin}`)

      if (fechaFin <= fechaInicio) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario')
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

      // Para Representante de Centro, crear una elección por cada jornada
      if (formData.tipo_eleccion === 'REPRESENTANTE_CENTRO') {
        for (const jornada of formData.jornadas) {
          const electionData: CreateElectionData = {
            titulo: `${formData.titulo} - ${jornada.charAt(0).toUpperCase() + jornada.slice(1)}`,
            descripcion: formData.descripcion.trim(),
            tipo_eleccion: formData.tipo_eleccion,
            fecha_inicio: `${formData.fecha_inicio}T${formData.hora_inicio}`,
            fecha_fin: `${formData.fecha_fin}T${formData.hora_fin}`,
            jornada: jornada,
          }
          
          console.log('📤 Enviando datos de elección (jornada):', electionData)
          await electionsApi.create(electionData)
        }
        
        toast.success(`¡${formData.jornadas.length} elecciones creadas exitosamente!`)
      } else {
        // Para otros tipos, crear una sola elección
        const electionData: CreateElectionData = {
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim(),
          tipo_eleccion: formData.tipo_eleccion,
          fecha_inicio: `${formData.fecha_inicio}T${formData.hora_inicio}`,
          fecha_fin: `${formData.fecha_fin}T${formData.hora_fin}`,
          // Incluir id_ficha si es VOCERO_FICHA
          ...(shouldShowFichaInput && { 
            id_ficha: getFichaIdFromNumero(formData.numero_ficha.trim()) 
          })
        }

        console.log('📤 Enviando datos de elección:', electionData)
        await electionsApi.create(electionData)
        toast.success('¡Elección creada exitosamente!')
      }
      
      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        tipo_eleccion: '',
        fecha_inicio: '',
        hora_inicio: '06:00',
        fecha_fin: '',
        hora_fin: '23:59',
        jornadas: ['mixta', 'nocturna', 'madrugada'],
        numero_ficha: ''
      })

      onElectionCreated()
      onClose()

    } catch (error) {
      console.error('Error creando elección:', error)
      const errorMessage = handleApiError(error)
      
      // Manejo de errores más específico
      if (errorMessage.includes('ficha')) {
        setErrors({ numero_ficha: errorMessage })
      } else if (errorMessage.includes('fecha')) {
        setErrors({ fecha_inicio: errorMessage })
      } else {
        setErrors({ general: errorMessage })
        toast.error(`Error: ${errorMessage}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar cierre del modal
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        titulo: '',
        descripcion: '',
        tipo_eleccion: '',
        fecha_inicio: '',
        hora_inicio: '06:00',
        fecha_fin: '',
        hora_fin: '23:59',
        jornadas: ['mixta', 'nocturna', 'madrugada'],
        numero_ficha: ''
      })
      setErrors({})
      onClose()
    }
  }

  // Obtener información del tipo seleccionado
  const selectedType = tiposEleccion.find(t => t.value === formData.tipo_eleccion)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay mejorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md z-50"
            onClick={handleClose}
          />

          {/* Modal principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Premium */}
              <div className="relative bg-gradient-to-r from-sena-600 via-sena-500 to-emerald-500 px-8 py-6 flex-shrink-0">
                {/* Patrón de fondo */}
                <div className={`absolute inset-0 bg-[url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'><circle cx='50' cy='50' r='1' fill='white' opacity='0.1'/></pattern></defs><rect width='100' height='100' fill='url(%23grain)'/></svg>")] opacity-20`}></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SparklesIcon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Nueva Elección</h2>
                      <p className="text-white/80 text-sm">Crear una experiencia electoral memorable</p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Contenido con scroll personalizado */}
              <div className="flex-1 min-h-0 px-8 py-8 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-8 pb-8">
                  {/* Error general mejorado */}
                  <AnimatePresence>
                    {errors.general && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl"
                      >
                        <p className="text-sm text-red-700 font-medium">{errors.general}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Información básica */}
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Información Básica</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Título de la Elección *
                        </label>
                        <Input
                          type="text"
                          value={formData.titulo}
                          onChange={(e) => handleInputChange('titulo', e.target.value)}
                          placeholder="Ej: Elección de Vocero de Ficha 2999518"
                          error={errors.titulo}
                          disabled={isSubmitting}
                          className="text-lg"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Descripción
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange('descripcion', e.target.value)}
                          placeholder="Describe el propósito y objetivos de esta elección..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sena-500 focus:border-sena-500 transition-all duration-200 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Tipo de elección - Diseño minimalista */}
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Tipo de Elección</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {tiposEleccion.map((tipo) => {
                        const IconComponent = tipo.icon
                        const isSelected = formData.tipo_eleccion === tipo.value
                        
                        return (
                          <motion.div
                            key={tipo.value}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative group cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'ring-2 ring-sena-500 ring-offset-2'
                                : ''
                            }`}
                            onClick={() => handleInputChange('tipo_eleccion', tipo.value)}
                          >
                            <div className={`relative overflow-hidden rounded-2xl bg-white border transition-all duration-300 ${
                              isSelected
                                ? 'border-sena-500 shadow-lg shadow-sena-500/20'
                                : 'border-gray-200 hover:border-gray-300 group-hover:shadow-md'
                            }`}>
                              
                              {/* Header con icono */}
                              <div className="p-6 pb-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                    isSelected
                                      ? 'bg-sena-500 text-white'
                                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                  }`}>
                                    <IconComponent className="w-6 h-6" />
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      className="w-6 h-6 bg-sena-500 rounded-full flex items-center justify-center"
                                    >
                                      <CheckCircleIcon className="w-4 h-4 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{tipo.label}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{tipo.description}</p>
                              </div>
                              
                              {/* Features minimalistas */}
                              <div className="px-6 pb-4">
                                <div className="space-y-2">
                                  {tipo.features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                        isSelected ? 'bg-sena-500' : 'bg-gray-400'
                                      }`} />
                                      <span className="text-xs text-gray-600">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Footer con badge */}
                              <div className="px-6 pb-6">
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-sena-100 text-sena-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {tipo.nivel}
                                </div>
                              </div>
                              
                              {/* Indicador de selección sutil */}
                              {isSelected && (
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sena-500 to-emerald-500"
                                />
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                    
                    {errors.tipo_eleccion && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-600 font-medium"
                      >
                        {errors.tipo_eleccion}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Campo de número de ficha - Diseño especial */}
                  <AnimatePresence>
                    {shouldShowFichaInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="w-4 h-4 text-white" />
                          </div>
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
                          
                          {/* Fichas disponibles con diseño premium */}
                          <div className="mt-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Fichas Disponibles:</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              {['3037689', '3037399', '3070126', '2999518'].map((ficha) => (
                                <motion.button
                                  key={ficha}
                                  type="button"
                                  onClick={() => handleInputChange('numero_ficha', ficha)}
                                  disabled={isSubmitting}
                                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {ficha}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Jornadas - Solo para Representante de Centro */}
                  <AnimatePresence>
                    {shouldShowJornadas && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Jornadas de Votación</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {jornadasDisponibles.map((jornada) => {
                            const isSelected = formData.jornadas.includes(jornada.value)
                            
                            return (
                              <motion.label
                                key={jornada.value}
                                className="cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleJornadaChange(jornada.value, e.target.checked)}
                                  className="sr-only"
                                  disabled={isSubmitting}
                                />
                                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                                  isSelected
                                    ? 'border-white shadow-lg scale-105'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <div className={`${jornada.color} p-6 ${jornada.textColor}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h4 className="font-bold text-lg">{jornada.label}</h4>
                                        <p className="text-sm opacity-90">{jornada.subtitle}</p>
                                      </div>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                                        >
                                          <CheckCircleIcon className="w-4 h-4 text-white" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <p className="text-sm opacity-80">{jornada.horario}</p>
                                  </div>
                                </div>
                              </motion.label>
                            )
                          })}
                        </div>
                        
                        {errors.jornadas && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-red-600 font-medium"
                          >
                            {errors.jornadas}
                          </motion.p>
                        )}
                        
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                          <p className="text-sm text-blue-700">
                            <strong>Nota:</strong> Se creará una elección independiente para cada jornada seleccionada.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fechas y horarios - Diseño mejorado */}
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Fechas y Horarios</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Fecha y hora de inicio */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          Inicio de Elección
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fecha de Inicio *
                            </label>
                            <Input
                              type="date"
                              value={formData.fecha_inicio}
                              onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                              min={getMinDate()}
                              error={errors.fecha_inicio}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Hora de Inicio *
                            </label>
                            <Input
                              type="time"
                              value={formData.hora_inicio}
                              onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                              min={formData.fecha_inicio === getMinDate() ? getMinTime() : undefined}
                              error={errors.hora_inicio}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fecha y hora de fin */}
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          Fin de Elección
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fecha de Fin *
                            </label>
                            <Input
                              type="date"
                              value={formData.fecha_fin}
                              onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                              min={formData.fecha_inicio || getMinDate()}
                              error={errors.fecha_fin}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Hora de Fin *
                            </label>
                            <Input
                              type="time"
                              value={formData.hora_fin}
                              onChange={(e) => handleInputChange('hora_fin', e.target.value)}
                              error={errors.hora_fin}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Resumen de la elección */}
                  {formData.tipo_eleccion && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-sena-50 to-green-50 rounded-2xl p-6 border border-sena-200"
                    >
                      <h4 className="font-bold text-sena-800 mb-4 flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Resumen de tu Elección
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Tipo:</span>
                          <span className="ml-2 text-gray-900">{selectedType?.label}</span>
                        </div>
                        {shouldShowFichaInput && formData.numero_ficha && (
                          <div>
                            <span className="font-medium text-gray-600">Ficha:</span>
                            <span className="ml-2 text-gray-900 font-mono">{formData.numero_ficha}</span>
                          </div>
                        )}
                        {shouldShowJornadas && (
                          <div className="lg:col-span-2">
                            <span className="font-medium text-gray-600">Jornadas:</span>
                            <span className="ml-2 text-gray-900">
                              {formData.jornadas.map(j => j.charAt(0).toUpperCase() + j.slice(1)).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Footer con botones premium */}
              <div className="border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm px-8 py-6 flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Paso final:</span> Revisa la información antes de crear
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl border-2 hover:bg-gray-100 transition-all duration-200"
                    >
                      Cancelar
                    </Button>
                    
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || !formData.tipo_eleccion}
                        className="px-8 py-3 bg-gradient-to-r from-sena-600 to-emerald-600 hover:from-sena-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-white font-semibold"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-4 h-4" />
                            <span>Crear Elección</span>
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Estilos personalizados para el scroll */}
          <style >{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #10b981, #059669);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #059669, #047857);
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  )
}

export default CreateElectionModal