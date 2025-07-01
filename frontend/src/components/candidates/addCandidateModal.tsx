// AddCandidateModal.tsx - MEJORADO con lista de aprendices y filtros
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { candidatesApi, handleApiError } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AddCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  electionId: number
  onCandidateAdded: () => void
}

interface Aprendiz {
  id_persona: number
  numero_documento: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  email: string
  telefono: string
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
}

interface Ficha {
  id_ficha: number
  numero_ficha: string
  nombre_programa: string
  jornada: string
}

const AddCandidateModal = ({ isOpen, onClose, electionId, onCandidateAdded }: AddCandidateModalProps) => {
  const [aprendices, setAprendices] = useState<Aprendiz[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [selectedAprendiz, setSelectedAprendiz] = useState<Aprendiz | null>(null)
  const [numeroLista, setNumeroLista] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFicha, setSelectedFicha] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)

  // Estado para formulario manual
  const [manualForm, setManualForm] = useState({
    numero_documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: ''
  })

  // Cargar aprendices y fichas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadAprendices()
      loadFichas()
    }
  }, [isOpen])

  const loadAprendices = async () => {
    try {
      setLoading(true)
      // ✅ CORREGIDO: Usar endpoint real
      const response = await fetch('/api/v1/personas/aprendices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}` // Ajustar según tu implementación
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAprendices(data)
      } else {
        throw new Error('Error cargando aprendices')
      }
    } catch (error) {
      console.error('Error cargando aprendices:', error)
      toast.error('Error cargando lista de aprendices')
      
      // ✅ Fallback con datos simulados para desarrollo
      const simulatedAprendices: Aprendiz[] = [
        {
          id_persona: 1,
          numero_documento: '1234567890',
          nombres: 'Juan Carlos',
          apellidos: 'García López',
          nombreCompleto: 'Juan Carlos García López',
          email: 'juan.garcia@sena.edu.co',
          telefono: '3001234567',
          ficha: {
            id_ficha: 1,
            numero_ficha: '2669742',
            nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
            jornada: 'mixta'
          },
          sede: {
            id_sede: 1,
            nombre_sede: 'Sede Principal'
          }
        },
        {
          id_persona: 2,
          numero_documento: '0987654321',
          nombres: 'María Fernanda',
          apellidos: 'Rodríguez Torres',
          nombreCompleto: 'María Fernanda Rodríguez Torres',
          email: 'maria.rodriguez@sena.edu.co',
          telefono: '3009876543',
          ficha: {
            id_ficha: 2,
            numero_ficha: '3037399',
            nombre_programa: 'OPERACIONES COMERCIALES',
            jornada: 'nocturna'
          },
          sede: {
            id_sede: 1,
            nombre_sede: 'Sede Principal'
          }
        },
        {
          id_persona: 3,
          numero_documento: '1122334455',
          nombres: 'Andrés Felipe',
          apellidos: 'Martínez Silva',
          nombreCompleto: 'Andrés Felipe Martínez Silva',
          email: 'andres.martinez@sena.edu.co',
          telefono: '3011223344',
          ficha: {
            id_ficha: 3,
            numero_ficha: '3070126',
            nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
            jornada: 'madrugada'
          },
          sede: {
            id_sede: 2,
            nombre_sede: 'Sede TIC'
          }
        }
      ]
      setAprendices(simulatedAprendices)
    } finally {
      setLoading(false)
    }
  }

  const loadFichas = async () => {
    try {
      // ✅ CORREGIDO: Usar endpoint real
      const response = await fetch('/api/v1/fichas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}` // Ajustar según tu implementación
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFichas(data)
      } else {
        throw new Error('Error cargando fichas')
      }
    } catch (error) {
      console.error('Error cargando fichas:', error)
      
      // ✅ Fallback con datos simulados para desarrollo
      const simulatedFichas: Ficha[] = [
        {
          id_ficha: 1,
          numero_ficha: '2669742',
          nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
          jornada: 'mixta'
        },
        {
          id_ficha: 2,
          numero_ficha: '3037399',
          nombre_programa: 'OPERACIONES COMERCIALES',
          jornada: 'nocturna'
        },
        {
          id_ficha: 3,
          numero_ficha: '3070126',
          nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
          jornada: 'madrugada'
        }
      ]
      setFichas(simulatedFichas)
    }
  }

  // Filtrar aprendices
  const filteredAprendices = aprendices.filter(aprendiz => {
    const matchesSearch = 
      aprendiz.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aprendiz.numero_documento.includes(searchTerm) ||
      aprendiz.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFicha = selectedFicha === 'all' || 
      aprendiz.ficha?.numero_ficha === selectedFicha

    return matchesSearch && matchesFicha
  })

  const handleSubmit = async () => {
    if (!selectedAprendiz && !showManualForm) {
      toast.error('Debe seleccionar un aprendiz')
      return
    }

    if (!numeroLista.trim()) {
      toast.error('Debe ingresar un número de lista')
      return
    }

    if (showManualForm) {
      // Validar formulario manual
      if (!manualForm.numero_documento.trim() || !manualForm.nombres.trim() || !manualForm.apellidos.trim()) {
        toast.error('Debe completar todos los campos obligatorios')
        return
      }
    }

    try {
      setSubmitting(true)

      const candidateData = showManualForm 
        ? {
            id_eleccion: electionId,
            numero_documento: manualForm.numero_documento,
            numero_lista: parseInt(numeroLista),
            // Datos adicionales para candidato manual
            nombres: manualForm.nombres,
            apellidos: manualForm.apellidos,
            email: manualForm.email,
            telefono: manualForm.telefono
          }
        : {
            id_eleccion: electionId,
            numero_documento: selectedAprendiz!.numero_documento,
            numero_lista: parseInt(numeroLista)
          }

      await candidatesApi.create(candidateData)
      
      toast.success('Candidato agregado exitosamente')
      onCandidateAdded()
      handleClose()

    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error agregando candidato: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedAprendiz(null)
    setNumeroLista('')
    setSearchTerm('')
    setSelectedFicha('all')
    setShowManualForm(false)
    setManualForm({
      numero_documento: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: ''
    })
    onClose()
  }

  const getJornadaColor = (jornada: string) => {
    switch (jornada) {
      case 'mixta': return 'bg-blue-100 text-blue-800'
      case 'nocturna': return 'bg-purple-100 text-purple-800'
      case 'madrugada': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-sena-50 to-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                      <UserPlusIcon className="w-5 h-5 text-sena-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Agregar Candidato</h2>
                      <p className="text-sm text-gray-600">Seleccionar aprendiz para postular como candidato</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[600px]">
                {/* Panel izquierdo - Lista de aprendices */}
                <div className="w-2/3 border-r border-gray-200 flex flex-col">
                  {/* Filtros y búsqueda */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-col gap-3">
                      {/* Toggle entre lista y manual */}
                      <div className="flex space-x-2">
                        <Button
                          variant={!showManualForm ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setShowManualForm(false)}
                        >
                          Seleccionar de Lista
                        </Button>
                        <Button
                          variant={showManualForm ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setShowManualForm(true)}
                        >
                          Agregar Manualmente
                        </Button>
                      </div>

                      {!showManualForm && (
                        <>
                          {/* Búsqueda */}
                          <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Buscar por nombre, documento o email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9 text-sm"
                            />
                          </div>

                          {/* Filtro por ficha */}
                          <select
                            value={selectedFicha}
                            onChange={(e) => setSelectedFicha(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
                          >
                            <option value="all">Todas las fichas</option>
                            {fichas.map((ficha) => (
                              <option key={ficha.id_ficha} value={ficha.numero_ficha}>
                                {ficha.numero_ficha} - {ficha.nombre_programa} ({ficha.jornada})
                              </option>
                            ))}
                          </select>

                          <div className="text-xs text-gray-500">
                            {filteredAprendices.length} aprendices encontrados
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lista de aprendices o formulario manual */}
                  <div className="flex-1 overflow-y-auto">
                    {showManualForm ? (
                      /* Formulario manual */
                      <div className="p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Datos del Candidato</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Número de Documento *
                            </label>
                            <Input
                              type="text"
                              value={manualForm.numero_documento}
                              onChange={(e) => setManualForm(prev => ({ ...prev, numero_documento: e.target.value }))}
                              placeholder="1234567890"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombres *
                            </label>
                            <Input
                              type="text"
                              value={manualForm.nombres}
                              onChange={(e) => setManualForm(prev => ({ ...prev, nombres: e.target.value }))}
                              placeholder="Juan Carlos"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Apellidos *
                            </label>
                            <Input
                              type="text"
                              value={manualForm.apellidos}
                              onChange={(e) => setManualForm(prev => ({ ...prev, apellidos: e.target.value }))}
                              placeholder="García López"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <Input
                              type="email"
                              value={manualForm.email}
                              onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="juan.garcia@sena.edu.co"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Teléfono
                            </label>
                            <Input
                              type="text"
                              value={manualForm.telefono}
                              onChange={(e) => setManualForm(prev => ({ ...prev, telefono: e.target.value }))}
                              placeholder="3001234567"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Lista de aprendices */
                      <div className="p-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-sena-500 border-t-transparent rounded-full"
                            />
                          </div>
                        ) : filteredAprendices.length > 0 ? (
                          <div className="space-y-2">
                            {filteredAprendices.map((aprendiz) => (
                              <motion.div
                                key={aprendiz.id_persona}
                                whileHover={{ scale: 1.01 }}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedAprendiz?.id_persona === aprendiz.id_persona
                                    ? 'border-sena-500 bg-sena-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedAprendiz(aprendiz)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{aprendiz.nombreCompleto}</h4>
                                    <p className="text-sm text-gray-600">Doc: {aprendiz.numero_documento}</p>
                                    <p className="text-xs text-gray-500">{aprendiz.email}</p>
                                  </div>
                                  <div className="text-right">
                                    {aprendiz.ficha && (
                                      <>
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getJornadaColor(aprendiz.ficha.jornada)}`}>
                                          {aprendiz.ficha.jornada}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Ficha {aprendiz.ficha.numero_ficha}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No se encontraron aprendices</p>
                            <p className="text-sm">Intente ajustar los filtros de búsqueda</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel derecho - Detalles y confirmación */}
                <div className="w-1/3 p-6 bg-gray-50 flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-4">Detalles del Candidato</h3>

                  {(selectedAprendiz || showManualForm) ? (
                    <div className="flex-1 space-y-4">
                      {/* Información del candidato */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        {showManualForm ? (
                          <div>
                            <h4 className="font-medium text-gray-900">Candidato Manual</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {manualForm.nombres} {manualForm.apellidos}
                            </p>
                            <p className="text-xs text-gray-500">
                              Doc: {manualForm.numero_documento}
                            </p>
                          </div>
                        ) : selectedAprendiz && (
                          <div>
                            <h4 className="font-medium text-gray-900">{selectedAprendiz.nombreCompleto}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Documento: {selectedAprendiz.numero_documento}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedAprendiz.email}
                            </p>
                            {selectedAprendiz.ficha && (
                              <div className="mt-2">
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getJornadaColor(selectedAprendiz.ficha.jornada)}`}>
                                  {selectedAprendiz.ficha.jornada}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ficha {selectedAprendiz.ficha.numero_ficha}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {selectedAprendiz.ficha.nombre_programa}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Número de lista */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Lista *
                        </label>
                        <Input
                          type="number"
                          value={numeroLista}
                          onChange={(e) => setNumeroLista(e.target.value)}
                          placeholder="1"
                          min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Número que aparecerá en la papeleta de votación
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <UserPlusIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Seleccione un aprendiz para continuar</p>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleSubmit}
                      disabled={(!selectedAprendiz && !showManualForm) || !numeroLista.trim() || submitting}
                      loading={submitting}
                      className="w-full"
                    >
                      {submitting ? 'Agregando...' : 'Agregar Candidato'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={submitting}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddCandidateModal