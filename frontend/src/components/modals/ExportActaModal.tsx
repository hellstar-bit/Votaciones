// 📁 frontend/src/components/modals/ExportActaModal.tsx - Modal Unificado
// ====================================================================

import { useState } from 'react'
import { XMarkIcon, DocumentArrowDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { electionsApi, type Election } from '../../services/api'
import Button from '../ui/Button'

interface ExportActaModalProps {
  isOpen: boolean
  onClose: () => void
  election: Election | null
}

export default function ExportActaModal({ isOpen, onClose, election }: ExportActaModalProps) {
  const [instructor, setInstructor] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Reset del modal
  const resetModal = () => {
    setInstructor('')
    setIsExporting(false)
    onClose()
  }

  // Manejar exportación
  const handleExport = async () => {
    if (!election) {
      toast.error('No hay elección seleccionada')
      return
    }

    if (!instructor.trim()) {
      toast.error('El nombre del instructor es requerido')
      return
    }

    if (election.estado !== 'finalizada') {
      toast.error('Solo se pueden generar actas de elecciones finalizadas')
      return
    }

    setIsExporting(true)
    
    try {
      console.log('🎯 Iniciando descarga de acta:', {
        electionId: election.id_eleccion,
        tipoEleccion: election.tipoEleccion?.nombre_tipo,
        instructor: instructor.trim()
      })

      // ✅ EL MISMO MÉTODO FUNCIONA PARA AMBOS TIPOS DE ELECCIÓN
      await electionsApi.downloadActa(election.id_eleccion, instructor.trim())
      
      toast.success(`Acta de ${getElectionTypeLabel()} descargada exitosamente`)
      resetModal()
      
    } catch (error) {
      console.error('❌ Error descargando acta:', error)
      toast.error(error instanceof Error ? error.message : 'Error descargando acta')
    } finally {
      setIsExporting(false)
    }
  }

  // Obtener etiqueta del tipo de elección
  const getElectionTypeLabel = (): string => {
    if (!election?.tipoEleccion?.nombre_tipo) return 'elección'
    
    switch (election.tipoEleccion.nombre_tipo) {
      case 'REPRESENTANTE_CENTRO':
        return 'Representante de Centro'
      case 'VOCERO_FICHA':
        return 'Vocero de Ficha'
      default:
        return 'elección'
    }
  }

  // Obtener información específica según el tipo
  const getElectionSpecificInfo = () => {
    if (!election) return null

    if (election.tipoEleccion?.nombre_tipo === 'REPRESENTANTE_CENTRO') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Acta de Representante de Centro</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Se incluirá información del ganador y segundo lugar</li>
                <li>• Se mostrarán todos los candidatos con sus votos</li>
                <li>• Jornada: {election.jornada || 'Todas las jornadas'}</li>
                <li>• Centro: {election.centro?.nombre_centro || 'N/A'}</li>
                <li>• Requisitos específicos para representantes de centro</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    if (election.tipoEleccion?.nombre_tipo === 'VOCERO_FICHA') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Acta de Vocero de Ficha</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Se incluirá información del vocero elegido</li>
                <li>• Se mostrarán todos los candidatos con sus votos</li>
                <li>• Ficha: {election.ficha?.numero_ficha || 'N/A'}</li>
                <li>• Programa: {election.ficha?.nombre_programa || 'N/A'}</li>
                <li>• Requisitos específicos para voceros de programa</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  if (!isOpen || !election) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="w-6 h-6 text-sena-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Exportar Acta de {getElectionTypeLabel()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {election.titulo}
                </p>
              </div>
            </div>
            <button
              onClick={resetModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Información general */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Información del Acta</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Se generará un acta oficial con formato SENA</li>
              <li>• Los datos se llenarán automáticamente del sistema</li>
              <li>• Solo necesita proporcionar el nombre del instructor</li>
              <li>• El archivo se descargará en formato PDF</li>
            </ul>
          </div>

          {/* Información específica del tipo de elección */}
          {getElectionSpecificInfo()}

          {/* Estado de la elección */}
          <div className="my-6 p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Estado de la Elección</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado actual:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                election.estado === 'finalizada' 
                  ? 'bg-green-100 text-green-800'
                  : election.estado === 'activa'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {election.estado.charAt(0).toUpperCase() + election.estado.slice(1)}
              </span>
            </div>
            
            {election.estado !== 'finalizada' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Solo se pueden generar actas de elecciones finalizadas.
                </p>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Instructor <span className="text-red-500">*</span>
              </label>
              <input
                id="instructor"
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Ingrese el nombre completo del instructor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 outline-none transition-colors"
                disabled={isExporting || election.estado !== 'finalizada'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Este nombre aparecerá en el acta como instructor responsable
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={resetModal}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={!instructor.trim() || isExporting || election.estado !== 'finalizada'}
              loading={isExporting}
              className="bg-sena-600 hover:bg-sena-700"
            >
              {isExporting ? (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Descargar Acta PDF
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> El acta se generará automáticamente según el tipo de elección. 
              Para {getElectionTypeLabel()}, se incluirán todos los requisitos y formatos específicos 
              establecidos por el SENA.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}