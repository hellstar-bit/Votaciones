// CreateElectionModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
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
}

interface FormErrors {
  titulo?: string
  tipo_eleccion?: string
  fecha_inicio?: string
  hora_inicio?: string
  fecha_fin?: string
  hora_fin?: string
  jornadas?: string
  general?: string
}

const CreateElectionModal = ({ isOpen, onClose, onElectionCreated }: CreateElectionModalProps) => {
  const [formData, setFormData] = useState<FormData>({
  titulo: '',
  descripcion: '',
  tipo_eleccion: '',
  fecha_inicio: '',
  hora_inicio: '08:00',
  fecha_fin: '',
  hora_fin: '18:00',
  jornadas: ['mixta', 'nocturna', 'madrugada'],
})

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tipos de elección/aspiración disponibles
  const tiposEleccion = [
    { value: 'VOCERO_FICHA', label: 'Vocero o Líder de Ficha', nivel: 'FICHA' },
    { value: 'LIDER_SEDE', label: 'Representante de Sede', nivel: 'SEDE' },
    { value: 'REPRESENTANTE_CENTRO', label: 'Representante de Centro', nivel: 'CENTRO' },
  ]

  // Jornadas disponibles
  const jornadasDisponibles = [
    { value: 'mixta', label: 'Mixta (Diurna)' },
    { value: 'nocturna', label: 'Nocturna' },
    { value: 'madrugada', label: 'Madrugada' },
  ]

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof FormData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  // Manejar cambio en jornadas (checkbox)
  const handleJornadaChange = (jornada: string, checked: boolean) => {
    const newJornadas = checked 
      ? [...formData.jornadas, jornada]
      : formData.jornadas.filter(j => j !== jornada)
    
    handleInputChange('jornadas', newJornadas)
  }

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar título
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio'
    } else if (formData.titulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres'
    }

    // Validar tipo de elección
    if (!formData.tipo_eleccion) {
      newErrors.tipo_eleccion = 'Debe seleccionar un tipo de elección'
    }

    // Validar fechas
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es obligatoria'
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria'
    }

    if (!formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin es obligatoria'
    }

    // Validar jornadas para Representante de Centro
    if (formData.tipo_eleccion === 'REPRESENTANTE_CENTRO' && formData.jornadas.length === 0) {
      newErrors.jornadas = 'Debe seleccionar al menos una jornada'
    }

    // Validar lógica de fechas
    if (formData.fecha_inicio && formData.fecha_fin && formData.hora_inicio && formData.hora_fin) {
      const fechaInicioCompleta = new Date(`${formData.fecha_inicio}T${formData.hora_inicio}`)
      const fechaFinCompleta = new Date(`${formData.fecha_fin}T${formData.hora_fin}`)
      const ahora = new Date()

      if (fechaInicioCompleta <= ahora) {
        newErrors.fecha_inicio = 'La fecha y hora de inicio debe ser futura'
      }

      if (fechaInicioCompleta >= fechaFinCompleta) {
        newErrors.fecha_fin = 'La fecha y hora de fin debe ser posterior a la de inicio'
      }

      // Validar que la duración mínima sea de 1 hora
      const duracionHoras = (fechaFinCompleta.getTime() - fechaInicioCompleta.getTime()) / (1000 * 60 * 60)
      if (duracionHoras < 1) {
        newErrors.hora_fin = 'La votación debe durar al menos 1 hora'
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
        }

        await electionsApi.create(electionData)
        toast.success('¡Elección creada exitosamente!')
      }
      
      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        tipo_eleccion: '',
        fecha_inicio: '',
        hora_inicio: '08:00',
        fecha_fin: '',
        hora_fin: '18:00',
        jornadas: ['mixta', 'nocturna', 'madrugada'],
      })

      // Notificar al componente padre y cerrar modal
      onElectionCreated()
      onClose()

    } catch (error) {
      console.error('Error creando elección:', error)
      const errorMessage = handleApiError(error)
      
      // Si es un error de validación específico, mostrarlo en el campo correspondiente
      if (errorMessage.includes('fecha')) {
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
        hora_inicio: '08:00',
        fecha_fin: '',
        hora_fin: '18:00',
        jornadas: ['mixta', 'nocturna', 'madrugada'],
      })
      setErrors({})
      onClose()
    }
  }

  // Obtener fecha mínima para el input (mañana)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Verificar si debe mostrar selector de jornadas
  const shouldShowJornadas = formData.tipo_eleccion === 'REPRESENTANTE_CENTRO'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-sena-50 to-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-sena-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Nueva Elección</h2>
                      <p className="text-sm text-gray-600">Crear una nueva elección en el sistema</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Error general */}
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-red-600 text-sm">{errors.general}</p>
                    </motion.div>
                  )}

                  {/* Información básica */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                    
                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título de la Elección *
                      </label>
                      <Input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => handleInputChange('titulo', e.target.value)}
                        placeholder="Ej: Elección de Representante de Centro 2025"
                        className={errors.titulo ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.titulo && (
                        <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
                      )}
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                        placeholder="Descripción opcional de la elección..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 transition-colors resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Tipo de elección */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Elección/Aspiración *
                      </label>
                      <select
                        value={formData.tipo_eleccion}
                        onChange={(e) => handleInputChange('tipo_eleccion', e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 transition-colors ${
                          errors.tipo_eleccion ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        disabled={isSubmitting}
                      >
                        <option value="">Seleccionar tipo de elección...</option>
                        {tiposEleccion.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label} ({tipo.nivel})
                          </option>
                        ))}
                      </select>
                      {errors.tipo_eleccion && (
                        <p className="mt-1 text-sm text-red-600">{errors.tipo_eleccion}</p>
                      )}
                    </div>

                    {/* Jornadas - Solo para Representante de Centro */}
                    {shouldShowJornadas && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jornadas de Votación *
                        </label>
                        <div className="space-y-2">
                          {jornadasDisponibles.map((jornada) => (
                            <label key={jornada.value} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.jornadas.includes(jornada.value)}
                                onChange={(e) => handleJornadaChange(jornada.value, e.target.checked)}
                                className="w-4 h-4 text-sena-600 bg-gray-100 border-gray-300 rounded focus:ring-sena-500 focus:ring-2"
                                disabled={isSubmitting}
                              />
                              <span className="text-sm text-gray-700">{jornada.label}</span>
                            </label>
                          ))}
                        </div>
                        {errors.jornadas && (
                          <p className="mt-1 text-sm text-red-600">{errors.jornadas}</p>
                        )}
                        <div className="mt-2 p-3 bg-sena-50 border border-sena-200 rounded-lg">
                          <p className="text-sm text-sena-700">
                            <strong>Nota:</strong> Se creará una elección independiente para cada jornada seleccionada. 
                            Cada jornada tendrá su propio representante.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Configuración de tiempo */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-gray-600" />
                      Fechas y Horarios de Votación
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fecha y hora inicio */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Inicio de Votación *
                        </label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={formData.fecha_inicio}
                            onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                            min={getMinDate()}
                            className={errors.fecha_inicio ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                            disabled={isSubmitting}
                          />
                          <Input
                            type="time"
                            value={formData.hora_inicio}
                            onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                            className={errors.hora_inicio ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                            disabled={isSubmitting}
                          />
                        </div>
                        {(errors.fecha_inicio || errors.hora_inicio) && (
                          <p className="text-sm text-red-600">
                            {errors.fecha_inicio || errors.hora_inicio}
                          </p>
                        )}
                      </div>

                      {/* Fecha y hora fin */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Fin de Votación *
                        </label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={formData.fecha_fin}
                            onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                            min={formData.fecha_inicio || getMinDate()}
                            className={errors.fecha_fin ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                            disabled={isSubmitting}
                          />
                          <Input
                            type="time"
                            value={formData.hora_fin}
                            onChange={(e) => handleInputChange('hora_fin', e.target.value)}
                            className={errors.hora_fin ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                            disabled={isSubmitting}
                          />
                        </div>
                        {(errors.fecha_fin || errors.hora_fin) && (
                          <p className="text-sm text-red-600">
                            {errors.fecha_fin || errors.hora_fin}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información de fechas */}
                    <div className="bg-sena-50 border border-sena-200 rounded-lg p-4">
                      <p className="text-sm text-sena-700">
                        <strong>Recomendación:</strong> Las votaciones tradicionalmente se realizan de 8:00 AM a 6:00 PM. 
                        Asegúrate de que el horario permita la máxima participación de la comunidad académica.
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    className="bg-sena-600 hover:bg-sena-700"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Elección'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CreateElectionModal