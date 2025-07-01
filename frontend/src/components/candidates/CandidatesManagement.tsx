// CandidatesManagement.tsx - MEJORADO con funcionalidades completas
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { candidatesApi, electionsApi, handleApiError, type Candidate, type Election } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AddCandidateModal from './addCandidateModal.tsx'

interface CandidatesManagementProps {
  electionId: number
  onBack: () => void
}

const CandidatesManagement = ({ electionId, onBack }: CandidatesManagementProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'validado' | 'rechazado'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [electionId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [candidatesData, electionData] = await Promise.all([
        candidatesApi.getByElection(electionId),
        electionsApi.getById(electionId)
      ])
      
      setCandidates(candidatesData)
      setElection(electionData)
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando datos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCandidate = async (candidateId: number) => {
    try {
      setProcessing(true)
      await candidatesApi.validate(candidateId)
      toast.success('Candidato validado exitosamente')
      await loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error validando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectCandidate = async () => {
    if (!selectedCandidate) return

    try {
      setProcessing(true)
      await candidatesApi.reject(selectedCandidate.id_candidato, rejectReason)
      toast.success('Candidato rechazado')
      setShowRejectModal(false)
      setSelectedCandidate(null)
      setRejectReason('')
      await loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error rechazando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return

    try {
      setProcessing(true)
      await candidatesApi.remove(selectedCandidate.id_candidato)
      toast.success('Candidato eliminado')
      setShowDeleteModal(false)
      setSelectedCandidate(null)
      await loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error eliminando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  // Filtrar candidatos
  const filteredCandidates = candidates.filter(candidate => {
    const nombreCompleto = candidate.persona?.nombreCompleto || ''
    const numeroDocumento = candidate.persona?.numero_documento || ''
    const estado = candidate.estado || ''
    
    const matchesSearch = nombreCompleto
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      numeroDocumento.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || estado === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Obtener estadísticas
  const stats = {
    total: candidates.length,
    pendientes: candidates.filter(c => c.estado === 'pendiente').length,
    validados: candidates.filter(c => c.estado === 'validado').length,
    rechazados: candidates.filter(c => c.estado === 'rechazado').length,
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'validado': return 'bg-green-100 text-green-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'rechazado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'validado': return <CheckCircleIcon className="w-4 h-4" />
      case 'pendiente': return <ClockIcon className="w-4 h-4" />
      case 'rechazado': return <XCircleIcon className="w-4 h-4" />
      default: return null
    }
  }

  const canModifyCandidates = election?.estado === 'configuracion'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-sena-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                icon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestión de Candidatos</h1>
                <p className="text-sm text-gray-500">{election?.titulo}</p>
              </div>
            </div>

            {canModifyCandidates && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<PlusIcon className="w-4 h-4" />}
                className="bg-sena-600 hover:bg-sena-700"
              >
                Agregar Candidato
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Validados</p>
                <p className="text-2xl font-bold text-green-600">{stats.validados}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Rechazados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rechazados}</p>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </motion.div>

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar candidatos por nombre o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="validado">Validados</option>
                <option value="rechazado">Rechazados</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Lista de candidatos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Candidatos ({filteredCandidates.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredCandidates.length > 0 ? (
              <div className="space-y-4">
                {filteredCandidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id_candidato}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-sena-100 rounded-lg flex items-center justify-center">
                          <span className="text-sena-600 font-bold text-lg">
                            {candidate.numero_lista}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {candidate.persona?.nombreCompleto}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Documento: {candidate.persona?.numero_documento}
                          </p>
                          <p className="text-xs text-gray-500">
                            {candidate.persona?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.estado)}`}>
                          {getStatusIcon(candidate.estado)}
                          {candidate.estado.charAt(0).toUpperCase() + candidate.estado.slice(1)}
                        </span>

                        {canModifyCandidates && (
                          <div className="flex space-x-2">
                            {candidate.estado === 'pendiente' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleValidateCandidate(candidate.id_candidato)}
                                  disabled={processing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Validar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCandidate(candidate)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={processing}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setShowDeleteModal(true)
                              }}
                              disabled={processing}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {candidate.motivo_rechazo && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Motivo del rechazo:</strong> {candidate.motivo_rechazo}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay candidatos</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No se encontraron candidatos con los filtros aplicados'
                    : 'Aún no se han agregado candidatos a esta elección'
                  }
                </p>
                {canModifyCandidates && !searchTerm && filterStatus === 'all' && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    icon={<PlusIcon className="w-4 h-4" />}
                    className="bg-sena-600 hover:bg-sena-700"
                  >
                    Agregar Primer Candidato
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Información sobre restricciones */}
        {!canModifyCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Modificación restringida
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    {election?.estado === 'activa' 
                      ? 'No se pueden modificar candidatos durante la votación activa.'
                      : 'Esta elección ha finalizado. Los candidatos no pueden ser modificados.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modales */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        electionId={electionId}
        onCandidateAdded={loadData}
      />

      {/* Modal de rechazo */}
      {showRejectModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Rechazar Candidato
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Está seguro que desea rechazar a <strong>{selectedCandidate.persona?.nombreCompleto}</strong>?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
                  placeholder="Explique el motivo del rechazo..."
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedCandidate(null)
                    setRejectReason('')
                  }}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRejectCandidate}
                  loading={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Eliminar Candidato
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                ¿Está seguro que desea eliminar permanentemente a <strong>{selectedCandidate.persona?.nombreCompleto}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedCandidate(null)
                  }}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteCandidate}
                  loading={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidatesManagement