// CandidatesManagement.tsx
import { useState, useEffect } from 'react'
import { motion} from 'framer-motion'
import { 
  CheckCircleIcon, 
  XCircleIcon,
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { candidatesApi, electionsApi, handleApiError, type Candidate, type Election } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AddCandidateModal from './addCandidateModal'

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

  // Cargar datos de la elección y candidatos
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

  // Validar candidato
  const handleValidateCandidate = async (candidateId: number) => {
    try {
      await candidatesApi.validate(candidateId)
      toast.success('Candidato validado exitosamente')
      await loadData() // Recargar datos
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error validando candidato: ${errorMessage}`)
    }
  }

  // Filtrar candidatos
  const filteredCandidates = candidates.filter(candidate => {
  // Validar que existan los campos antes de usar toLowerCase
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
            
            <Button
              onClick={() => setIsAddModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
              disabled={election?.estado !== 'configuracion'}
            >
              Agregar Candidato
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validados</p>
                <p className="text-3xl font-bold text-green-600">{stats.validados}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazados</p>
                <p className="text-3xl font-bold text-red-600">{stats.rechazados}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
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

            {/* Filtro por estado */}
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
          transition={{ delay: 0.6 }}
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-sena-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-sena-100 rounded-full flex items-center justify-center">
                        <span className="text-sena-600 font-semibold text-lg">
                          {candidate.persona.nombres.charAt(0)}{candidate.persona.apellidos.charAt(0)}
                        </span>
                      </div>
                      
                      {/* Información */}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {candidate.persona.nombreCompleto}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Documento: {candidate.persona.numero_documento}
                        </p>
                        {candidate.votos_recibidos > 0 && (
                          <p className="text-sm text-sena-600">
                            Votos recibidos: {candidate.votos_recibidos}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Estado */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.estado)}`}>
                        {getStatusIcon(candidate.estado)}
                        {candidate.estado.charAt(0).toUpperCase() + candidate.estado.slice(1)}
                      </span>

                      {/* Acciones */}
                      {candidate.estado === 'pendiente' && election?.estado === 'configuracion' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateCandidate(candidate.id_candidato)}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            Validar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No se encontraron candidatos' : 'No hay candidatos'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Agrega el primer candidato para esta elección'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all') && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    icon={<PlusIcon className="w-4 h-4" />}
                    disabled={election?.estado !== 'configuracion'}
                  >
                    Agregar Candidato
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Información de la elección */}
        {election?.estado !== 'configuracion' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex">
              <DocumentTextIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Elección en estado: {election?.estado}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {election?.estado === 'activa' 
                    ? 'No se pueden agregar más candidatos durante la votación activa.'
                    : 'Esta elección ha finalizado. Los candidatos no pueden ser modificados.'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modal para agregar candidato */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        electionId={electionId}
        onCandidateAdded={loadData}
      />
    </div>
  )
}

export default CandidatesManagement