// ElectionSettings.tsx - MEJORADO según requerimientos específicos
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
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, candidatesApi, handleApiError, type Election, type Candidate } from '../../services/api'
import Button from '../ui/Button'
import DeleteConfirmationModal from './DeleteConfirmationModal'

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
      await electionsApi.cancel(electionId)
      toast.success('Elección cancelada exitosamente')
      setShowCancelModal(false)
      await loadData() // Recargar datos para actualizar estado
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cancelando elección: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // ✅ CAMBIO: Eliminar elección (solo si está cancelada)
  const handleDeleteElection = async () => {
    try {
      setIsProcessing(true)
      await electionsApi.delete(electionId)
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

  // ✅ CAMBIO: Lógica actualizada según requerimientos
  const canCancel = election?.estado === 'activa'
  const canDelete = election?.estado === 'cancelada' // ✅ Solo se puede eliminar si está cancelada
  const hasVotes = election?.total_votos_emitidos && election.total_votos_emitidos > 0

  const getStatusInfo = (estado: string) => {
    switch (estado) {
      case 'configuracion':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <Cog6ToothIcon className="w-4 h-4" />,
          text: 'En Configuración'
        }
      case 'activa':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="w-4 h-4" />,
          text: 'Activa'
        }
      case 'finalizada':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <CheckCircleIcon className="w-4 h-4" />,
          text: 'Finalizada'
        }
      case 'cancelada':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircleIcon className="w-4 h-4" />,
          text: 'Cancelada'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <ClockIcon className="w-4 h-4" />,
          text: estado
        }
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
                <h1 className="text-xl font-bold text-gray-900">Configuración de Elección</h1>
                <p className="text-sm text-gray-500">{election?.titulo}</p>
              </div>
            </div>

            {/* Estado de la elección */}
            {election && (
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(election.estado).color}`}>
                  {getStatusInfo(election.estado).icon}
                  {getStatusInfo(election.estado).text}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información general de la elección */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Título</p>
              <p className="font-medium text-gray-900">{election?.titulo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo de Elección</p>
              <p className="font-medium text-gray-900">{election?.tipoEleccion?.nombre_tipo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Votantes Habilitados</p>
              <p className="font-medium text-gray-900">{election?.total_votantes_habilitados}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Votos Emitidos</p>
              <p className="font-medium text-gray-900">{election?.total_votos_emitidos}</p>
            </div>
          </div>
        </motion.div>

        {/* Estado de candidatos */}
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
                <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
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
                <ClockIcon className="w-8 h-8 text-yellow-600 mr-3" />
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

        {/* Acciones disponibles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
            Acciones de Gestión
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
                    disabled={isProcessing}
                  >
                    Cancelar Elección
                  </Button>
                </div>
              </div>
            )}

            {/* ✅ CAMBIO: Eliminar elección cancelada */}
            {canDelete && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-red-800">Eliminar Elección Cancelada</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Esta acción eliminará permanentemente la elección cancelada y todos sus datos asociados (candidatos, votos, votantes habilitados). 
                      <strong> Esta acción no se puede deshacer.</strong>
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Solo se pueden eliminar elecciones que han sido canceladas previamente
                    </p>
                    {hasVotes && (
                      <p className="text-xs text-red-600 mt-1">
                        📊 Se eliminarán {election?.total_votos_emitidos} votos registrados
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-600 border-red-300 hover:bg-red-100"
                    icon={<TrashIcon className="w-4 h-4" />}
                    disabled={isProcessing}
                  >
                    Eliminar Elección
                  </Button>
                </div>
              </div>
            )}

            {/* ✅ CAMBIO: Información actualizada cuando no se pueden hacer acciones */}
            {!canCancel && !canDelete && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">Estado Actual</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {election?.estado === 'configuracion' && 
                        'Esta elección está en configuración. Las acciones de gestión estarán disponibles cuando esté activa.'
                      }
                      {election?.estado === 'finalizada' && 
                        'Esta elección ha finalizado. No se pueden realizar modificaciones.'
                      }
                      {election?.estado === 'activa' && !canCancel &&
                        'Esta elección está activa pero no se puede cancelar en este momento.'
                      }
                      {election?.estado === 'cancelada' && !canDelete &&
                        'Esta elección está cancelada. Puede ser eliminada si cumple con los requisitos.'
                      }
                    </p>
                    
                    {/* ✅ NUEVO: Mensaje específico para elecciones canceladas */}
                    {election?.estado === 'cancelada' && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-700">
                          <strong>Proceso de eliminación:</strong> Para eliminar esta elección cancelada, 
                          asegúrese de que no existan dependencias críticas del sistema.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Modal de confirmación para cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <XCircleIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Cancelar Elección
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                ¿Está seguro que desea cancelar la elección <strong>"{election?.titulo}"</strong>?
              </p>
              
              {hasVotes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Atención:</strong> Esta elección ya tiene {election?.total_votos_emitidos} votos emitidos. 
                    Los votos se conservarán pero no se podrán emitir más.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  No, mantener
                </Button>
                <Button
                  onClick={handleCancelElection}
                  loading={isProcessing}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  Sí, cancelar elección
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de eliminación mejorado */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteElection}
        election={election}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default ElectionSettings