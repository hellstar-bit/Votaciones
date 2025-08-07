
import React, { useState } from 'react'
import { Plus, Upload, FileText, History, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import ImportModal from '../../components/import/importModal'
import { importApi, type ImportResult } from '../../services/api'

const AdminImportPage: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false)
  const [importHistory, setImportHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Cargar historial de importaciones
  const loadImportHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const history = await importApi.getImportHistory()
      setImportHistory(history)
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error('Error cargando historial de importaciones')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Manejar importación completada
  const handleImportComplete = (result: ImportResult) => {
    console.log('Importación completada:', result)
    setShowImportModal(false)
    loadImportHistory() // Recargar historial
    
    if (result.success) {
      toast.success(`✅ Importación exitosa: ${result.importedRecords} aprendices importados`)
    } else {
      toast.error(`⚠️ Importación con errores: ${result.errors.length} errores encontrados`)
    }
  }

  // Descargar plantilla Excel
  const handleDownloadTemplate = async () => {
    try {
      const blob = await importApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Plantilla_Importacion_Aprendices.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('📥 Plantilla descargada exitosamente')
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      toast.error('Error descargando plantilla')
    }
  }

  React.useEffect(() => {
    loadImportHistory()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Importar Aprendices</h1>
            <p className="text-gray-600 mt-2">
              Importa aprendices desde archivos Excel de forma masiva
            </p>
          </div>
        </div>

        {/* Cards de acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Importar Excel */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-sena-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Upload className="h-8 w-8 text-sena-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Importar Excel</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Sube un archivo Excel con los datos de los aprendices para importarlos al sistema.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full bg-sena-500 text-white px-4 py-2 rounded-lg hover:bg-sena-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Importación
            </button>
          </div>

          {/* Descargar Plantilla */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Plantilla Excel</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Descarga la plantilla oficial de Excel con el formato correcto para la importación.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total importaciones:</span>
                <span className="font-semibold">{importHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Últimas 24h:</span>
                <span className="font-semibold text-green-600">
                  {importHistory.filter(imp => {
                    const today = new Date()
                    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
                    return new Date(imp.fecha) > yesterday
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de importaciones */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Importaciones
              </h2>
              <button
                onClick={loadImportHistory}
                disabled={isLoadingHistory}
                className="text-sena-500 hover:text-sena-600 font-medium"
              >
                {isLoadingHistory ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {importHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay importaciones
                </h3>
                <p className="text-gray-600">
                  Aún no se han realizado importaciones de aprendices.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importHistory.map((importItem) => (
                    <tr key={importItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {importItem.filename}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(importItem.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {importItem.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {importItem.registros_importados} / {importItem.registros_totales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          importItem.estado === 'completado'
                            ? 'bg-green-100 text-green-800'
                            : importItem.estado === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {importItem.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de importación */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </AdminLayout>
  )
}

export default AdminImportPage