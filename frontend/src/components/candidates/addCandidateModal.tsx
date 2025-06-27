// AddCandidateModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
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

interface PersonaData {
  id_persona: number
  numero_documento: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  correo_electronico?: string
  telefono?: string
}

const AddCandidateModal = ({ isOpen, onClose, electionId, onCandidateAdded }: AddCandidateModalProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaData[]>([])
  const [selectedPerson, setSelectedPerson] = useState<PersonaData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Buscar personas por documento o nombre
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda')
      return
    }

    setIsSearching(true)
    try {
      // Simular búsqueda de personas - aquí iría tu API real
      // Por ahora, datos de ejemplo
      const mockResults: PersonaData[] = [
        {
          id_persona: 1,
          numero_documento: searchTerm,
          nombres: 'Juan Carlos',
          apellidos: 'Pérez García',
          nombreCompleto: 'Juan Carlos Pérez García',
          correo_electronico: 'juan.perez@example.com',
          telefono: '3001234567'
        },
        {
          id_persona: 2,
          numero_documento: '987654321',
          nombres: 'María José',
          apellidos: 'González López',
          nombreCompleto: 'María José González López',
          correo_electronico: 'maria.gonzalez@example.com',
          telefono: '3007654321'
        }
      ]

      // Filtrar por el término de búsqueda
      const filtered = mockResults.filter(person => 
        person.numero_documento.includes(searchTerm) ||
        person.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
      )

      setSearchResults(filtered)
      
      if (filtered.length === 0) {
        toast.error('No se encontraron personas con ese criterio de búsqueda')
      }
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error en la búsqueda: ${errorMessage}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Manejar selección de persona
  const handleSelectPerson = (person: PersonaData) => {
    setSelectedPerson(person)
  }

  // Agregar candidato
  const handleAddCandidate = async () => {
    if (!selectedPerson) {
      toast.error('Selecciona una persona para agregar como candidato')
      return
    }

    setIsSubmitting(true)
    try {
      await candidatesApi.create({
        id_eleccion: electionId,
        numero_documento: selectedPerson.numero_documento,
        numero_lista: 1 // O generar el siguiente número disponible
        })

      toast.success('Candidato agregado exitosamente')
      onCandidateAdded()
      handleClose()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error agregando candidato: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cerrar modal y limpiar estado
  const handleClose = () => {
    if (!isSubmitting) {
      setSearchTerm('')
      setSearchResults([])
      setSelectedPerson(null)
      onClose()
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
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
                      <p className="text-sm text-gray-600">Busca y selecciona una persona para agregar como candidato</p>
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
                <div className="p-6 space-y-6">
                  
                  {/* Búsqueda */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Buscar Persona</h3>
                    
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Número de documento o nombre completo..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        onClick={handleSearch}
                        loading={isSearching}
                        disabled={!searchTerm.trim() || isSubmitting}
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {/* Resultados de búsqueda */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Resultados ({searchResults.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {searchResults.map((person) => (
                          <motion.div
                            key={person.id_persona}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedPerson?.id_persona === person.id_persona
                                ? 'border-sena-500 bg-sena-50'
                                : 'border-gray-200 hover:border-sena-300'
                            }`}
                            onClick={() => handleSelectPerson(person)}
                          >
                            <div className="flex items-center space-x-4">
                              {/* Avatar */}
                              <div className="w-12 h-12 bg-sena-100 rounded-full flex items-center justify-center">
                                <span className="text-sena-600 font-semibold text-lg">
                                  {person.nombres.charAt(0)}{person.apellidos.charAt(0)}
                                </span>
                              </div>
                              
                              {/* Información */}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {person.nombreCompleto}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Documento: {person.numero_documento}
                                </p>
                                {person.correo_electronico && (
                                  <p className="text-sm text-gray-500">
                                    Email: {person.correo_electronico}
                                  </p>
                                )}
                              </div>

                              {/* Indicador de selección */}
                              {selectedPerson?.id_persona === person.id_persona && (
                                <div className="w-6 h-6 bg-sena-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Persona seleccionada */}
                  {selectedPerson && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Candidato Seleccionado</h3>
                      
                      <div className="bg-sena-50 border border-sena-200 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-sena-100 rounded-full flex items-center justify-center">
                            <span className="text-sena-600 font-bold text-xl">
                              {selectedPerson.nombres.charAt(0)}{selectedPerson.apellidos.charAt(0)}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {selectedPerson.nombreCompleto}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Documento: {selectedPerson.numero_documento}
                            </p>
                            {selectedPerson.correo_electronico && (
                              <p className="text-sm text-gray-600">
                                Email: {selectedPerson.correo_electronico}
                              </p>
                            )}
                            {selectedPerson.telefono && (
                              <p className="text-sm text-gray-600">
                                Teléfono: {selectedPerson.telefono}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Información importante</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• El candidato será agregado en estado "Pendiente" para validación</li>
                      <li>• Debe ser validado antes de que la elección pueda activarse</li>
                      <li>• Solo se pueden agregar candidatos en elecciones en "Configuración"</li>
                    </ul>
                  </div>
                </div>
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
                    type="button"
                    onClick={handleAddCandidate}
                    loading={isSubmitting}
                    disabled={!selectedPerson}
                    className="bg-sena-600 hover:bg-sena-700"
                  >
                    {isSubmitting ? 'Agregando...' : 'Agregar Candidato'}
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

export default AddCandidateModal