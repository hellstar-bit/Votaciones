// 📁 frontend/src/components/modals/ExportActaModal.tsx
// ====================================================================
import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { electionsApi } from '../../services/api'

interface ExportActaModalProps {
  isOpen: boolean
  onClose: () => void
  election: {
    id_eleccion: number
    titulo: string
    estado: string
  }
}

export default function ExportActaModal({ isOpen, onClose, election }: ExportActaModalProps) {
  const [instructor, setInstructor] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!instructor.trim()) {
      toast.error('El nombre del instructor es requerido')
      return
    }

    setIsExporting(true)
    try {
      // Llamar al endpoint de exportación
      await electionsApi.exportActaPdf(election.id_eleccion, instructor.trim())
      
      toast.success('Acta exportada exitosamente')
      onClose()
      setInstructor('')
    } catch (error) {
      console.error('Error exportando acta:', error)
      toast.error('Error exportando el acta PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const resetModal = () => {
    setInstructor('')
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={resetModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                      <DocumentArrowDownIcon className="w-6 h-6 text-sena-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Exportar Acta PDF
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
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

                {/* Información */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Información del Acta</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Se generará un acta oficial con formato SENA</li>
                    <li>• Los datos se llenarán automáticamente del sistema</li>
                    <li>• Solo necesita proporcionar el nombre del instructor</li>
                    <li>• El archivo se descargará en formato PDF</li>
                  </ul>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 transition-colors"
                      disabled={isExporting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este nombre aparecerá en el acta oficial
                    </p>
                  </div>
                </div>

                {/* Verificación de estado */}
                {election.estado !== 'finalizada' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Solo se pueden generar actas de elecciones finalizadas
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={resetModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isExporting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting || !instructor.trim() || election.estado !== 'finalizada'}
                    className="px-4 py-2 bg-sena-600 text-white rounded-lg hover:bg-sena-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>Exportar Acta</span>
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}