// 📁 frontend/src/components/import/ImportModal.tsx
import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { importApi } from '../../services/api'
import type { ExcelPreviewResult, ImportResult, ImportOptions } from '../../services/api'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (result: ImportResult) => void
}

type ImportStep = 'upload' | 'preview' | 'options' | 'importing' | 'results'

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ExcelPreviewResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    validateFichas: true,
    createMissingFichas: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      handlePreview(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handlePreview = async (file: File) => {
    setIsLoading(true)
    try {
      const preview = await importApi.previewExcel(file)
      setPreviewData(preview)
      setCurrentStep('preview')
      toast.success('Vista previa generada exitosamente')
    } catch (error: any) {
      console.error('Error generando preview:', error)
      toast.error(error.response?.data?.message || 'Error procesando archivo')
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setCurrentStep('importing')
    setIsLoading(true)

    try {
      const result = await importApi.importExcel(selectedFile, importOptions)
      setImportResults(result)
      setCurrentStep('results')
      
      if (result.success) {
        toast.success(`Importación completada: ${result.importedRecords} registros`)
        onImportComplete(result)
      } else {
        toast.error(`Importación con errores: ${result.errors.length} errores encontrados`)
      }
    } catch (error: any) {
      console.error('Error en importación:', error)
      toast.error(error.response?.data?.message || 'Error durante la importación')
      setCurrentStep('preview')
    } finally {
      setIsLoading(false)
    }
  }

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
      toast.success('Plantilla descargada exitosamente')
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      toast.error('Error descargando plantilla')
    }
  }

  const resetModal = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setPreviewData(null)
    setImportResults(null)
    setImportOptions({
      validateFichas: true,
      createMissingFichas: false,
    })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentArrowUpIcon className="w-6 h-6 text-sena-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Importar Aprendices desde Excel
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sena-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-4">
              <div className="flex items-center">
                {(['upload', 'preview', 'importing', 'results'] as ImportStep[]).map((step, index) => (
                  <React.Fragment key={step}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep === step || (index < (['upload', 'preview', 'importing', 'results'] as ImportStep[]).indexOf(currentStep))
                          ? 'bg-sena-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          index < (['upload', 'preview', 'importing', 'results'] as ImportStep[]).indexOf(currentStep)
                            ? 'bg-sena-600'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Subir Archivo</span>
                <span>Vista Previa</span>
                <span>Importando</span>
                <span>Resultados</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentStep === 'upload' && (
                <UploadStep
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                  selectedFile={selectedFile}
                  isLoading={isLoading}
                  onDownloadTemplate={handleDownloadTemplate}
                />
              )}

              {currentStep === 'preview' && previewData && (
                <PreviewStep
                  previewData={previewData}
                  onContinue={() => setCurrentStep('options')}
                  onBack={() => {
                    setCurrentStep('upload')
                    setSelectedFile(null)
                    setPreviewData(null)
                  }}
                />
              )}

              {currentStep === 'options' && (
                <OptionsStep
                  options={importOptions}
                  onOptionsChange={setImportOptions}
                  onImport={handleImport}
                  onBack={() => setCurrentStep('preview')}
                />
              )}

              {currentStep === 'importing' && (
                <ImportingStep />
              )}

              {currentStep === 'results' && importResults && (
                <ResultsStep
                  results={importResults}
                  onClose={handleClose}
                  onNewImport={() => {
                    resetModal()
                    setCurrentStep('upload')
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Componente para el paso de subida
const UploadStep: React.FC<{
  getRootProps: any
  getInputProps: any
  isDragActive: boolean
  selectedFile: File | null
  isLoading: boolean
  onDownloadTemplate: () => void
}> = ({ getRootProps, getInputProps, isDragActive, selectedFile, isLoading, onDownloadTemplate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    {/* Instrucciones */}
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex">
        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-blue-800">Formato requerido</h4>
          <div className="mt-1 text-sm text-blue-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Archivo Excel (.xlsx o .xls)</li>
              <li>Cada hoja debe corresponder a una ficha</li>
              <li>Headers en fila 6: Identificación, Nombre, Estado, correo, tel</li>
              <li>Tamaño máximo: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Botón de plantilla */}
    <div className="text-center">
      <button
        onClick={onDownloadTemplate}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Descargar Plantilla Excel
      </button>
    </div>

    {/* Área de drop */}
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragActive
          ? 'border-sena-400 bg-sena-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        {selectedFile ? (
          <div>
            <p className="text-lg font-medium text-green-600">✅ {selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
            </p>
            <p className="text-sm text-gray-500">
              o haz clic para seleccionar
            </p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sena-600"></div>
            <span className="ml-2 text-sm text-gray-600">Procesando archivo...</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)

// Componente para vista previa
const PreviewStep: React.FC<{
  previewData: ExcelPreviewResult
  onContinue: () => void
  onBack: () => void
}> = ({ previewData, onContinue, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    {/* Resumen */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen del Archivo</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-sena-600">{previewData.resumen.totalHojas}</div>
          <div className="text-xs text-gray-500">Hojas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{previewData.resumen.totalEstudiantes}</div>
          <div className="text-xs text-gray-500">Estudiantes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{previewData.resumen.fichas.length}</div>
          <div className="text-xs text-gray-500">Fichas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{previewData.resumen.totalErrores}</div>
          <div className="text-xs text-gray-500">Errores</div>
        </div>
      </div>
    </div>

    {/* Vista por hoja */}
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Vista Previa por Ficha</h4>
      {previewData.preview.map((sheet, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="font-medium text-gray-900">Ficha {sheet.numeroFicha}</h5>
              <p className="text-sm text-gray-600">{sheet.nombrePrograma}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-green-600">
                {sheet.totalEstudiantes} estudiantes
              </span>
              {sheet.erroresEncontrados > 0 && (
                <span className="text-red-600">
                  {sheet.erroresEncontrados} errores
                </span>
              )}
            </div>
          </div>

          {/* Muestra de estudiantes */}
          {sheet.muestra.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.muestra.map((student, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2">{student.documento}</td>
                      <td className="px-3 py-2">{student.nombre}</td>
                      <td className="px-3 py-2">{student.email}</td>
                      <td className="px-3 py-2">{student.telefono}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.totalEstudiantes > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ... y {sheet.totalEstudiantes - 5} estudiantes más
                </p>
              )}
            </div>
          )}

          {/* Errores */}
          {sheet.errores.length > 0 && (
            <div className="mt-3 bg-red-50 rounded-lg p-3">
              <h6 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h6>
              <ul className="text-xs text-red-700 space-y-1">
                {sheet.errores.slice(0, 3).map((error, idx) => (
                  <li key={idx}>
                    Fila {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Regresar
      </button>
      <button
        onClick={onContinue}
        className="px-4 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700"
      >
        Continuar
      </button>
    </div>
  </motion.div>
)

// Componente para opciones de importación
const OptionsStep: React.FC<{
  options: ImportOptions
  onOptionsChange: (options: ImportOptions) => void
  onImport: () => void
  onBack: () => void
}> = ({ options, onOptionsChange, onImport, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Opciones de Importación</h4>
      
      <div className="space-y-4">
        {/* Validar fichas */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="validateFichas"
              name="validateFichas"
              type="checkbox"
              checked={options.validateFichas}
              onChange={(e) =>
                onOptionsChange({ ...options, validateFichas: e.target.checked })
              }
              className="focus:ring-sena-500 h-4 w-4 text-sena-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="validateFichas" className="font-medium text-gray-700">
              Validar que las fichas existan
            </label>
            <p className="text-gray-500">
              Verificar que todas las fichas del archivo ya estén registradas en el sistema
            </p>
          </div>
        </div>

        {/* Crear fichas faltantes */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="createMissingFichas"
              name="createMissingFichas"
              type="checkbox"
              checked={options.createMissingFichas}
              disabled={!options.validateFichas}
              onChange={(e) =>
                onOptionsChange({ ...options, createMissingFichas: e.target.checked })
              }
              className="focus:ring-sena-500 h-4 w-4 text-sena-600 border-gray-300 rounded disabled:opacity-50"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="createMissingFichas" className="font-medium text-gray-700">
              Crear fichas faltantes automáticamente
            </label>
            <p className="text-gray-500">
              Si una ficha no existe, crearla automáticamente con la información del Excel
            </p>
          </div>
        </div>
      </div>

      {/* Advertencia */}
      <div className="bg-yellow-50 rounded-lg p-4 mt-6">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <h5 className="text-sm font-medium text-yellow-800">Importante</h5>
            <p className="mt-1 text-sm text-yellow-700">
              Esta acción importará todos los estudiantes válidos. Los registros duplicados 
              (mismo número de documento) serán omitidos automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Regresar
      </button>
      <button
        onClick={onImport}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700"
      >
        Iniciar Importación
      </button>
    </div>
  </motion.div>
)

// Componente para proceso de importación
const ImportingStep: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="text-center py-12"
  >
    <div className="space-y-6">
      <div className="mx-auto w-16 h-16 relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sena-600"></div>
        <CloudArrowUpIcon className="absolute inset-4 w-8 h-8 text-sena-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900">Importando datos...</h3>
        <p className="text-sm text-gray-500 mt-2">
          Esto puede tomar algunos minutos dependiendo del tamaño del archivo
        </p>
      </div>
      
      {/* Indicadores de progreso simulado */}
      <div className="max-w-xs mx-auto space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
          Archivo procesado
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-sena-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          Validando datos...
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
          Guardando en base de datos
        </div>
      </div>
    </div>
  </motion.div>
)

// Componente para mostrar resultados
const ResultsStep: React.FC<{
  results: ImportResult
  onClose: () => void
  onNewImport: () => void
}> = ({ results, onClose, onNewImport }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    {/* Estado general */}
    <div className={`rounded-lg p-4 ${results.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
      <div className="flex items-start">
        {results.success ? (
          <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3 mt-0.5" />
        ) : (
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 mr-3 mt-0.5" />
        )}
        <div>
          <h3 className={`text-lg font-medium ${results.success ? 'text-green-800' : 'text-yellow-800'}`}>
            {results.success ? 'Importación Completada' : 'Importación Completada con Advertencias'}
          </h3>
          <p className={`mt-1 text-sm ${results.success ? 'text-green-700' : 'text-yellow-700'}`}>
            {results.success 
              ? `Se importaron ${results.importedRecords} de ${results.totalRecords} registros exitosamente.`
              : `Se importaron ${results.importedRecords} registros, pero hay ${results.errors.length} errores que requieren atención.`
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tiempo de ejecución: {(results.executionTime / 1000).toFixed(2)} segundos
          </p>
        </div>
      </div>
    </div>

    {/* Estadísticas detalladas */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-green-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-green-600">{results.summary.importedRecords}</div>
        <div className="text-xs text-green-700">Importados</div>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-blue-600">{results.summary.duplicateRecords}</div>
        <div className="text-xs text-blue-700">Duplicados</div>
      </div>
      <div className="bg-red-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-red-600">{results.summary.errorRecords}</div>
        <div className="text-xs text-red-700">Con Errores</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-purple-600">{results.summary.totalSheets}</div>
        <div className="text-xs text-purple-700">Fichas</div>
      </div>
    </div>

    {/* Fichas procesadas */}
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Fichas Procesadas</h4>
      <div className="flex flex-wrap gap-2">
        {results.summary.fichasProcessed.map((ficha) => (
          <span
            key={ficha}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sena-100 text-sena-800"
          >
            {ficha}
          </span>
        ))}
      </div>
    </div>

    {/* Errores */}
    {results.errors.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-red-900 mb-2">Errores Encontrados</h4>
        <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
          <ul className="text-xs text-red-700 space-y-1">
            {results.errors.slice(0, 10).map((error, index) => (
              <li key={index}>
                <strong>Hoja {error.sheet}:</strong> {error.message}
                {error.field && <span className="text-red-600"> (campo: {error.field})</span>}
              </li>
            ))}
          </ul>
          {results.errors.length > 10 && (
            <p className="text-xs text-red-600 mt-2">
              ... y {results.errors.length - 10} errores más
            </p>
          )}
        </div>
      </div>
    )}

    {/* Advertencias */}
    {results.warnings.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Advertencias</h4>
        <div className="bg-yellow-50 rounded-lg p-3">
          <ul className="text-xs text-yellow-700 space-y-1">
            {results.warnings.map((warning, index) => (
              <li key={index}>
                <strong>Hoja {warning.sheet}:</strong> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )}

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onNewImport}
        className="px-4 py-2 text-sm font-medium text-sena-700 bg-sena-50 border border-sena-300 rounded-md hover:bg-sena-100"
      >
        Nueva Importación
      </button>
      <button
        onClick={onClose}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700"
      >
        Finalizar
      </button>
    </div>
  </motion.div>
)

export default ImportModal