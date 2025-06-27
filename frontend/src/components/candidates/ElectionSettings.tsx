// ElectionSettings.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  Cog6ToothIcon,
  TrashIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, candidatesApi, handleApiError, type Election, type Candidate } from '../../services/api'
import Button from '../ui/Button'
import ConfirmationModal from './ConfirmationModal'


interface ElectionSettingsProps {
  electionId: number
  onBack: () => void
}

const ElectionSettings = ({ electionId, onBack }: ElectionSettingsProps) => {
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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

  // Cancelar elección (cambiar estado a 'cancelada')
  const handleCancelElection = async () => {
    try {
      setIsProcessing(true)
      await electionsApi.cancel(electionId) // Necesitaremos agregar este endpoint
      toast.success('Elección cancelada exitosamente')
      setShowCancelModal(false)
      await loadData()
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cancelando elección: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Eliminar elección (solo si no ha empezado)
  const handleDeleteElection = async () => {
    try {
      setIsProcessing(true)
      await electionsApi.delete(electionId) // Necesitaremos agregar este endpoint
      toast.success('Elección eliminada exitosamente')
      setShowDeleteModal(false)
      onBack() // Volver al dashboard
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error eliminando elección: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const canCancel = election?.estado === 'activa'
  const canDelete = election?.estado === 'configuracion'
  const hasVotes = election?.total_votos_emitidos && election.total_votos_emitidos > 0

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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                  <Cog6ToothIcon className="w-5 h-5 text-sena-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Configuración de Elección</h1>
                  <p className="text-sm text-gray-500">{election?.titulo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Información de la elección */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Detalles Básicos</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Título:</span> {election?.titulo}</p>
                <p><span className="text-gray-500">Tipo:</span> {election?.tipoEleccion?.nombre_tipo}</p>
                <p><span className="text-gray-500">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    election?.estado === 'activa' ? 'bg-green-100 text-green-800' :
                    election?.estado === 'configuracion' ? 'bg-yellow-100 text-yellow-800' :
                    election?.estado === 'finalizada' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {election?.estado?.charAt(0).toUpperCase()}{election?.estado?.slice(1)}
                  </span>
                </p>
                <p><span className="text-gray-500">Descripción:</span> {election?.descripcion || 'Sin descripción'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Fechas y Participación</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Inicio:</span> {new Date(election?.fecha_inicio || '').toLocaleString()}</p>
                <p><span className="text-gray-500">Fin:</span> {new Date(election?.fecha_fin || '').toLocaleString()}</p>
                <p><span className="text-gray-500">Votantes habilitados:</span> {election?.total_votantes_habilitados || 0}</p>
                <p><span className="text-gray-500">Votos emitidos:</span> {election?.total_votos_emitidos || 0}</p>
                <p><span className="text-gray-500">Candidatos:</span> {candidates.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Estadísticas de candidatos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Candidatos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Validados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {candidates.filter(c => c.estado === 'validado').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {candidates.filter(c => c.estado === 'pendiente').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <XCircleIcon className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-600">Rechazados</p>
                  <p className="text-2xl font-bold text-red-900">
                    {candidates.filter(c => c.estado === 'rechazado').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Acciones peligrosas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            Acciones Peligrosas
          </h2>
          
          <div className="space-y-4">
            
            {/* Cancelar elección */}
            {canCancel && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-800">Cancelar Elección</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      La elección se marcará como cancelada. Los votos ya emitidos se conservarán pero no se podrán emitir más votos.
                    </p>
                    {hasVotes && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ Esta elección ya tiene {election?.total_votos_emitidos} votos emitidos
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-100"
                    icon={<XCircleIcon className="w-4 h-4" />}
                  >
                    Cancelar Elección
                  </Button>
                </div>
              </div>
            )}

            {/* Eliminar elección */}
            {canDelete && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-red-800">Eliminar Elección</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Esta acción eliminará permanentemente la elección y todos sus datos asociados. Esta acción no se puede deshacer.
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Solo se puede eliminar elecciones que no han iniciado
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-600 border-red-300 hover:bg-red-100"
                    icon={<TrashIcon className="w-4 h-4" />}
                  >
                    Eliminar Elección
                  </Button>
                </div>
              </div>
            )}

            {/* Información cuando no se pueden hacer acciones */}
            {!canCancel && !canDelete && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">Información</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {election?.estado === 'finalizada' 
                        ? 'Esta elección ha finalizado. No se pueden realizar modificaciones.'
                        : 'No hay acciones disponibles para el estado actual de la elección.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Modal de confirmación para cancelar */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelElection}
        title="Cancelar Elección"
        message={`¿Estás seguro de que quieres cancelar la elección "${election?.titulo}"? ${hasVotes ? `Esta elección ya tiene ${election?.total_votos_emitidos} votos emitidos.` : ''}`}
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        type="warning"
        isProcessing={isProcessing}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteElection}
        title="Eliminar Elección"
        message={`¿Estás seguro de que quieres eliminar permanentemente la elección "${election?.titulo}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default ElectionSettings