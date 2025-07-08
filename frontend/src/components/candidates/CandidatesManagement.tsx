// CandidatesManagement.tsx - Versión corregida y completa
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  IdentificationIcon,
  HashtagIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { candidatesApi, electionsApi, handleApiError, type Candidate, type Election } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AddCandidateModal from './AddCandidateModal'

interface CandidatesManagementProps {
  electionId: number
  onBack: () => void
}

interface EditCandidateData {
  id_candidato: number
  numero_lista: number
  nombres?: string
  apellidos?: string
  email?: string
  telefono?: string
}

const CandidatesManagement = ({ electionId, onBack }: CandidatesManagementProps) => {
  // Estados principales
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Estados para modales y acciones
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'validado' | 'pendiente' | 'rechazado'>('all')

  // Estados para edición
  const [editData, setEditData] = useState<EditCandidateData>({
    id_candidato: 0,
    numero_lista: 1,
    nombres: '',
    apellidos: '',
    email: '',
    telefono: ''
  })
  const [rejectReason, setRejectReason] = useState('')

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [electionId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [electionData, candidatesData] = await Promise.all([
        electionsApi.getById(electionId),
        candidatesApi.getByElection(electionId)
      ])

      setElection(electionData)
      setCandidates(candidatesData)
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando datos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Filtros
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.persona?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.persona?.numero_documento?.includes(searchTerm) ||
      candidate.numero_lista?.toString().includes(searchTerm)

    const matchesStatus = filterStatus === 'all' || candidate.estado === filterStatus

    return matchesSearch && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: candidates.length,
    validados: candidates.filter(c => c.estado === 'validado').length,
    pendientes: candidates.filter(c => c.estado === 'pendiente').length,
    rechazados: candidates.filter(c => c.estado === 'rechazado').length,
  }

  // Funciones de acción
  const handleValidateCandidate = async (candidate: Candidate) => {
    try {
      setProcessing(true)
      await candidatesApi.validate(candidate.id_candidato)
      toast.success('Candidato validado exitosamente')
      loadData()
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
      loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error rechazando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditCandidate = async () => {
    try {
      setProcessing(true)
      await candidatesApi.update(editData.id_candidato, {
        numero_lista: editData.numero_lista,
        nombres: editData.nombres,
        apellidos: editData.apellidos,
        email: editData.email,
        telefono: editData.telefono
      })
      toast.success('Candidato actualizado exitosamente')
      setShowEditModal(false)
      setSelectedCandidate(null)
      loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error actualizando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return

    try {
      setProcessing(true)
      await candidatesApi.remove(selectedCandidate.id_candidato)
      toast.success('Candidato eliminado permanentemente')
      setShowDeleteModal(false)
      setSelectedCandidate(null)
      loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error eliminando candidato: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  // Funciones auxiliares
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'validado': return 'bg-green-100 text-green-800 border-green-200'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const openEditModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setEditData({
      id_candidato: candidate.id_candidato,
      numero_lista: candidate.numero_lista,
      nombres: candidate.persona?.nombres || '',
      apellidos: candidate.persona?.apellidos || '',
      email: candidate.persona?.email || '',
      telefono: candidate.persona?.telefono || ''
    })
    setShowEditModal(true)
  }

  const openViewModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setShowViewModal(true)
  }

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.validados}</p>
                <p className="text-sm text-gray-500">Validados</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.rechazados}</p>
                <p className="text-sm text-gray-500">Rechazados</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controles de filtro y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Buscar por nombre, documento o número de lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                fullWidth
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="validado">Validados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="rechazado">Rechazados</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de candidatos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {filteredCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredCandidates.map((candidate, index) => (
                      <motion.tr
                        key={candidate.id_candidato}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-sena-600">
                                {candidate.numero_lista}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center mr-3 flex-shrink-0">
                              {candidate.persona?.foto_url ? (
                                <img
                                  src={candidate.persona.foto_url}
                                  alt={candidate.persona.nombreCompleto}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.persona?.nombreCompleto || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.persona?.email || 'Sin email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.persona?.numero_documento || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(candidate.estado)}`}>
                            {getStatusIcon(candidate.estado)}
                            <span className="ml-1 capitalize">{candidate.estado}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(candidate)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {canModifyCandidates && (
                              <>
                                <button
                                  onClick={() => openEditModal(candidate)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                  title="Editar"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>

                                {candidate.estado === 'pendiente' && (
                                  <button
                                    onClick={() => handleValidateCandidate(candidate)}
                                    disabled={processing}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                    title="Validar"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                )}

                                {candidate.estado !== 'rechazado' && (
                                  <button
                                    onClick={() => {
                                      setSelectedCandidate(candidate)
                                      setShowRejectModal(true)
                                    }}
                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                    title="Rechazar"
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedCandidate(candidate)
                                    setShowDeleteModal(true)
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1 rounded"
                                  title="Eliminar"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron candidatos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'No hay candidatos que coincidan con los filtros aplicados'
                  : 'Aún no se han agregado candidatos a esta elección'
                }
              </p>
              {canModifyCandidates && !searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<PlusIcon className="w-4 h-4" />}
                  className="mt-4 bg-sena-600 hover:bg-sena-700"
                >
                  Agregar Primer Candidato
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Información sobre restricciones */}
        {!canModifyCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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

      {/* Modal de visualización */}
      {showViewModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Detalles del Candidato
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-sena-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {selectedCandidate.persona?.foto_url ? (
                      <img
                        src={selectedCandidate.persona.foto_url}
                        alt={selectedCandidate.persona.nombreCompleto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-sena-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {selectedCandidate.persona?.nombreCompleto || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Lista #{selectedCandidate.numero_lista}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedCandidate.estado)}`}>
                        {getStatusIcon(selectedCandidate.estado)}
                        <span className="ml-1 capitalize">{selectedCandidate.estado}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <IdentificationIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Documento</p>
                      <p className="font-medium text-gray-900">
                        {selectedCandidate.persona?.numero_documento || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedCandidate.persona?.email || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.persona?.telefono && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-900">
                          {selectedCandidate.persona.telefono}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Editar Candidato
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Número de Lista"
                  type="number"
                  value={editData.numero_lista}
                  onChange={(e) => setEditData({ ...editData, numero_lista: parseInt(e.target.value) || 1 })}
                  min="1"
                  fullWidth
                />

                <Input
                  label="Nombres"
                  value={editData.nombres}
                  onChange={(e) => setEditData({ ...editData, nombres: e.target.value })}
                  fullWidth
                />

                <Input
                  label="Apellidos"
                  value={editData.apellidos}
                  onChange={(e) => setEditData({ ...editData, apellidos: e.target.value })}
                  fullWidth
                />

                <Input
                  label="Email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  fullWidth
                />

                <Input
                  label="Teléfono (opcional)"
                  value={editData.telefono}
                  onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                  fullWidth
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCandidate(null)
                  }}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditCandidate}
                  loading={processing}
                  className="flex-1 bg-sena-600 hover:bg-sena-700"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de rechazo */}
      {showRejectModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
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
          </motion.div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Eliminar Candidato
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                ¿Está seguro que desea eliminar permanentemente a <strong>{selectedCandidate.persona?.nombreCompleto}</strong>? 
                Esta acción no se puede deshacer y eliminará todos los datos del candidato.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Advertencia</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Esta acción es irreversible. Si la elección ya está activa, esto podría afectar los resultados.
                    </p>
                  </div>
                </div>
              </div>

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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Eliminar Permanentemente
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CandidatesManagement