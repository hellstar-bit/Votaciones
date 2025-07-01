// DeleteConfirmationModal.tsx - Modal específico para eliminación de elecciones
import { useState, useEffect } from 'react'
import { TrashIcon, ExclamationTriangleIcon,  CheckCircleIcon } from '@heroicons/react/24/outline'
import { electionsApi, type Election } from '../../services/api'
import Button from '../ui/Button'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  election: Election | null
  isProcessing: boolean
}

interface DeleteInfo {
  canDelete: boolean
  reason?: string
  details?: {
    votos_a_eliminar: number
    candidatos_a_eliminar: number
    votantes_a_eliminar: number
    estado_actual?: string
    estado_requerido?: string
  }
}

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  election, 
  isProcessing 
}: DeleteConfirmationModalProps) => {
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  useEffect(() => {
    if (isOpen && election) {
      loadDeleteInfo()
    }
  }, [isOpen, election])

  const loadDeleteInfo = async () => {
    if (!election) return
    
    try {
      setLoadingInfo(true)
      const info = await electionsApi.canDelete(election.id_eleccion)
      setDeleteInfo(info)
    } catch (error) {
      console.error('Error verificando eliminación:', error)
      setDeleteInfo({
        canDelete: false,
        reason: 'Error verificando si se puede eliminar la elección'
      })
    } finally {
      setLoadingInfo(false)
    }
  }

  if (!isOpen || !election) return null

  // ✅ FUNCIÓN HELPER: Determinar el título según el estado
  const getModalTitle = () => {
    switch (election.estado) {
      case 'cancelada':
        return 'Eliminar Elección Cancelada'
      case 'finalizada':
        return 'Eliminar Elección Finalizada'
      default:
        return 'Eliminar Elección'
    }
  }

  // ✅ FUNCIÓN HELPER: Mensaje contextual según el estado
  const getContextualMessage = () => {
    if (election.estado === 'finalizada') {
      return (
        <span className="block mt-2 text-xs text-gray-500">
          Esta elección ya finalizó y todos sus resultados se conservaron. 
          La eliminación es permanente y no se puede deshacer.
        </span>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {getModalTitle()}
            </h3>
          </div>
          
          {/* Mensaje principal */}
          <p className="text-sm text-gray-600 mb-4">
            ¿Está seguro que desea eliminar permanentemente la elección{' '}
            <strong>"{election.titulo}"</strong>?
            {getContextualMessage()}
          </p>

          {/* Información de carga */}
          {loadingInfo && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Verificando información de eliminación...
              </p>
            </div>
          )}

          {/* Información de eliminación */}
          {deleteInfo && !loadingInfo && (
            <>
              {deleteInfo.canDelete ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        {election.estado === 'cancelada' 
                          ? 'Esta elección cancelada puede ser eliminada'
                          : 'Esta elección finalizada puede ser eliminada'
                        }
                      </p>
                      
                      {deleteInfo.details && (
                        <div className="mt-2 text-xs text-green-700">
                          <p className="font-medium mb-1">Se eliminarán:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>{deleteInfo.details.candidatos_a_eliminar} candidatos registrados</li>
                            {deleteInfo.details.votos_a_eliminar > 0 && (
                              <li>{deleteInfo.details.votos_a_eliminar} votos emitidos</li>
                            )}
                            <li>{deleteInfo.details.votantes_a_eliminar} registros de votantes habilitados</li>
                          </ul>
                        </div>
                      )}

                      <p className="text-sm text-green-800 mt-2 font-medium">
                        ⚠️ Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        No se puede eliminar esta elección
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {deleteInfo.reason}
                      </p>
                      
                      {deleteInfo.details?.estado_actual && (
                        <p className="text-xs text-red-600 mt-2">
                          Estado actual: <strong>{deleteInfo.details.estado_actual}</strong>
                          <br />
                          Estado requerido: <strong>{deleteInfo.details.estado_requerido}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              loading={isProcessing}
              disabled={!deleteInfo?.canDelete || loadingInfo}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Eliminando...' : 'Eliminar permanentemente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal