// 📁 frontend/src/components/import/ImportModal.tsx
// MODAL COMPLETO ACTUALIZADO CON VALIDACIONES FLEXIBLES

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { importApi } from '../../services/api'
import type { ExcelPreviewResult, ImportResult, ImportOptions } from '../../services/api'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (result: ImportResult) => void
}

type ImportStep = 'upload' | 'preview' | 'options' | 'importing' | 'results'

// 🔧 OPCIONES EXTENDIDAS CON VALIDACIONES FLEXIBLES
interface ExtendedImportOptions extends ImportOptions {
  updateExisting?: boolean
  skipDuplicates?: boolean
  flexibleValidation?: boolean
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ExcelPreviewResult | null>(null)
  
  // 🔧 OPCIONES EXTENDIDAS CON VALORES POR DEFECTO FLEXIBLES
  const [importOptions, setImportOptions] = useState<ExtendedImportOptions>({
    validateFichas: false,        // 🔧 Por defecto NO validar fichas
    createMissingFichas: true,    // 🔧 Por defecto SÍ crear fichas
    updateExisting: false,        // 🔧 No actualizar por defecto
    skipDuplicates: true,         // 🔧 Omitir duplicados por defecto
    flexibleValidation: true      // 🔧 VALIDACIONES FLEXIBLES ACTIVADAS
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      console.log('📁 Archivo seleccionado:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      setSelectedFile(file)
      handlePreview(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/octet-stream': ['.xlsx', '.xls'] // 🔧 Para archivos sin MIME correcto
    },
    multiple: false,
    maxSize: 25 * 1024 * 1024, // 🔧 Aumentado a 25MB
  })

  const handlePreview = async (file: File) => {
    setIsLoading(true)
    try {
      console.log('🔍 Generando preview para:', file.name)
      const preview = await importApi.previewExcel(file)
      console.log('✅ Preview generado:', preview)
      
      setPreviewData(preview)
      setCurrentStep('preview')
      toast.success(`Vista previa: ${preview.resumen?.totalRegistros || 0} registros encontrados`)
    } catch (error: any) {
      console.error('❌ Error generando preview:', error)
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
      console.log('🚀 Iniciando importación con opciones:', importOptions)
      
      // 🔧 ENVIAR OPCIONES COMPLETAS AL BACKEND
      const result = await importApi.importExcel(selectedFile, importOptions)
      console.log('📊 Resultado de importación:', result)
      
      setImportResults(result)
      setCurrentStep('results')
      
      // 🔧 MENSAJES MEJORADOS
      if (result.success) {
        const mensaje = (result.recordsUpdated ?? 0) > 0 
          ? `Importación exitosa: ${result.importedRecords} nuevos, ${result.recordsUpdated ?? 0} actualizados`
          : `Importación exitosa: ${result.importedRecords} registros importados`
        
        toast.success(mensaje, { duration: 5000 })
        onImportComplete(result)
      } else {
        const erroresCount = result.errors?.length || 0
        const advertenciasCount = result.warnings?.length || 0
        
        toast.error(
          `Importación completada con ${erroresCount} errores y ${advertenciasCount} advertencias`, 
          { duration: 8000 }
        )
      }
    } catch (error: any) {
      console.error('❌ Error en importación:', error)
      toast.error(error.response?.data?.message || 'Error durante la importación')
      setCurrentStep('preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 Descargando plantilla...')
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
      console.error('❌ Error descargando plantilla:', error)
      toast.error('Error descargando plantilla')
    }
  }

  const resetModal = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setPreviewData(null)
    setImportResults(null)
    setImportOptions({
      validateFichas: false,
      createMissingFichas: true,
      updateExisting: false,
      skipDuplicates: true,
      flexibleValidation: true
    })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
            onClick={handleClose}
          />

          {/* Spacer */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="w-6 h-6 text-sena-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Importar Aprendices desde Excel
                    </h3>
                    {/* 🔧 INDICADOR DE VALIDACIONES FLEXIBLES */}
                    {importOptions.flexibleValidation && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Validaciones flexibles activadas
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sena-500 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mt-4">
                <div className="flex items-center">
                  {(['upload', 'preview', 'options', 'importing', 'results'] as ImportStep[]).map((step, index) => (
                    <React.Fragment key={step}>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          currentStep === step || (index < (['upload', 'preview', 'options', 'importing', 'results'] as ImportStep[]).indexOf(currentStep))
                            ? 'bg-sena-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < 4 && (
                        <div
                          className={`flex-1 h-1 mx-2 transition-colors ${
                            index < (['upload', 'preview', 'options', 'importing', 'results'] as ImportStep[]).indexOf(currentStep)
                              ? 'bg-sena-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Subir</span>
                  <span>Preview</span>
                  <span>Opciones</span>
                  <span>Importando</span>
                  <span>Resultados</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
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
                    onContinue={handleImport}
                    onBack={() => setCurrentStep('preview')}
                    isLoading={isLoading}
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
      </motion.div>
    </AnimatePresence>
  )
}

// ===================================================================
// COMPONENTES DE CADA PASO
// ===================================================================

// Paso 1: Upload
const UploadStep: React.FC<{
  getRootProps: any
  getInputProps: any
  isDragActive: boolean
  selectedFile: File | null
  isLoading: boolean
  onDownloadTemplate: () => void
}> = ({ getRootProps, getInputProps, isDragActive, selectedFile, isLoading, onDownloadTemplate }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    {/* Zona de arrastrar y soltar */}
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-sena-500 bg-sena-50 scale-105'
          : 'border-gray-300 hover:border-sena-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
      
      {isLoading ? (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sena-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Procesando archivo...</p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel aquí'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            o <span className="text-sena-600 font-medium cursor-pointer">haz clic para seleccionar</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Archivos soportados: .xlsx, .xls (máximo 25MB)
          </p>
        </div>
      )}
    </div>

    {/* Archivo seleccionado */}
    {selectedFile && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-900 truncate">
            {selectedFile.name}
          </p>
          <p className="text-xs text-green-700">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </motion.div>
    )}

    {/* 🔧 INFORMACIÓN SOBRE VALIDACIONES FLEXIBLES */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">✅ Validaciones flexibles activadas:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Acepta tipos de documento PPT, PP, CE automáticamente</li>
            <li>Limpieza automática de espacios y caracteres especiales</li>
            <li>División inteligente de nombres y apellidos</li>
            <li>Email y teléfono opcionales</li>
            <li>Validaciones de longitud más permisivas</li>
            <li>Mapeo automático de estados (MATRICULADO → ACTIVO)</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Botón de plantilla */}
    <div className="border-t pt-4">
      <button
        onClick={onDownloadTemplate}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500 transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Descargar Plantilla Excel
      </button>
      <p className="text-xs text-gray-500 mt-1">
        Descarga la plantilla oficial para asegurar el formato correcto
      </p>
    </div>
  </motion.div>
)

// Paso 2: Preview
const PreviewStep: React.FC<{
  previewData: ExcelPreviewResult
  onContinue: () => void
  onBack: () => void
}> = ({ previewData, onContinue, onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    {/* Resumen general */}
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 flex items-center">
        <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
        Vista Previa del Archivo
      </h4>
      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <span className="text-blue-700">Hojas encontradas:</span>
          <span className="font-medium text-blue-900 ml-1">{previewData.resumen?.totalHojas || 0}</span>
        </div>
        <div>
          <span className="text-blue-700">Total registros:</span>
          <span className="font-medium text-blue-900 ml-1">{previewData.resumen?.totalRegistros || 0}</span>
        </div>
        <div>
          <span className="text-blue-700">Errores encontrados:</span>
          <span className="font-medium text-red-600 ml-1">{previewData.resumen?.totalErrores || 0}</span>
        </div>
        <div>
          <span className="text-blue-700">Fichas detectadas:</span>
          <span className="font-medium text-blue-900 ml-1">{previewData.resumen?.fichas?.length || 0}</span>
        </div>
      </div>
    </div>

    {/* 🔧 MOSTRAR FICHAS Y PROGRAMAS DETECTADOS */}
    {previewData.resumen?.fichas && previewData.resumen.fichas.length > 0 && (
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900">Fichas y Programas Detectados:</h5>
        {previewData.resumen.fichas.map((ficha, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded border">
            <p className="font-medium text-gray-900">Ficha: {ficha}</p>
            {previewData.resumen?.programas?.[index] && (
              <p className="text-sm text-gray-600 mt-1">
                Programa: {previewData.resumen.programas[index]}
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {/* 🔧 MOSTRAR PREVIEW DE DATOS SI ESTÁ DISPONIBLE */}
    {previewData.preview && previewData.preview.length > 0 && (
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900">Muestra de Datos:</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewData.preview.slice(0, 5).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.documento}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{item.nombre}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.email}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.preview.length > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              ... y {previewData.preview.length - 5} registros más
            </p>
          )}
        </div>
      </div>
    )}

    {/* 🔧 ERRORES SI LOS HAY */}
    {(previewData.resumen?.totalErrores ?? 0) > 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">
              Se encontraron {previewData.resumen?.totalErrores ?? 0} posibles problemas
            </p>
            <p className="text-yellow-700 mt-1">
              Con las validaciones flexibles, la mayoría se resolverán automáticamente durante la importación.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        ← Volver
      </button>
      <button
        onClick={onContinue}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700 transition-colors"
      >
        Continuar →
      </button>
    </div>
  </motion.div>
)

// Paso 3: Options - 🔧 AMPLIADO CON NUEVAS OPCIONES
const OptionsStep: React.FC<{
  options: ExtendedImportOptions
  onOptionsChange: (options: ExtendedImportOptions) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
}> = ({ options, onOptionsChange, onContinue, onBack, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="flex items-center mb-4">
      <Cog6ToothIcon className="w-5 h-5 text-gray-600 mr-2" />
      <h4 className="font-medium text-gray-900">Configuración de Importación</h4>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Validaciones */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-gray-700 border-b pb-2">Validaciones</h5>
        
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={options.flexibleValidation}
            onChange={(e) => onOptionsChange({ ...options, flexibleValidation: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-sena-600 focus:ring-sena-500"
          />
          <div>
            <span className="text-sm text-gray-700 font-medium">✅ Validaciones flexibles</span>
            <p className="text-xs text-gray-500 mt-1">Recomendado: Acepta más tipos de datos y corrige automáticamente</p>
          </div>
        </label>

        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={options.validateFichas}
            onChange={(e) => onOptionsChange({ ...options, validateFichas: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-sena-600 focus:ring-sena-500"
          />
          <div>
            <span className="text-sm text-gray-700">Validar fichas existentes</span>
            <p className="text-xs text-gray-500 mt-1">Verificar que las fichas ya existan en el sistema</p>
          </div>
        </label>
        
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={options.createMissingFichas}
            onChange={(e) => onOptionsChange({ ...options, createMissingFichas: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-sena-600 focus:ring-sena-500"
          />
          <div>
            <span className="text-sm text-gray-700">Crear fichas faltantes</span>
            <p className="text-xs text-gray-500 mt-1">Crear automáticamente las fichas que no existan</p>
          </div>
        </label>
      </div>

      {/* Duplicados */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-gray-700 border-b pb-2">Manejo de Duplicados</h5>
        
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={options.skipDuplicates}
            onChange={(e) => onOptionsChange({ ...options, skipDuplicates: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-sena-600 focus:ring-sena-500"
          />
          <div>
            <span className="text-sm text-gray-700">Omitir duplicados</span>
            <p className="text-xs text-gray-500 mt-1">Saltar registros que ya existen (por documento)</p>
          </div>
        </label>
        
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={options.updateExisting}
            onChange={(e) => onOptionsChange({ ...options, updateExisting: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-sena-600 focus:ring-sena-500"
          />
          <div>
            <span className="text-sm text-gray-700">Actualizar existentes</span>
            <p className="text-xs text-gray-500 mt-1">Actualizar datos de personas que ya existen</p>
          </div>
        </label>
      </div>
    </div>

    {/* 🔧 CONFIGURACIÓN RECOMENDADA */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start">
        <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-green-800">Configuración recomendada:</p>
          <p className="text-green-700 mt-1">
            ✅ Validaciones flexibles, ✅ Crear fichas faltantes, ✅ Omitir duplicados
          </p>
          <button
            onClick={() => onOptionsChange({
              validateFichas: false,
              createMissingFichas: true,
              updateExisting: false,
              skipDuplicates: true,
              flexibleValidation: true
            })}
            className="text-xs text-green-600 hover:text-green-800 mt-2 underline"
          >
            Aplicar configuración recomendada
          </button>
        </div>
      </div>
    </div>

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        ← Volver
      </button>
      <button
        onClick={onContinue}
        disabled={isLoading}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700 disabled:opacity-50 transition-colors flex items-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Importando...
          </>
        ) : (
          'Comenzar Importación'
        )}
      </button>
    </div>
  </motion.div>
)

// Paso 4: Importing
const ImportingStep: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="text-center py-12"
  >
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sena-600 mx-auto"></div>
    <h4 className="mt-6 text-lg font-medium text-gray-900">Importando datos...</h4>
    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
      Por favor espera mientras procesamos y validamos los registros. 
      Esto puede tomar unos momentos dependiendo del tamaño del archivo.
    </p>
    
    {/* 🔧 INDICADORES DE PROGRESO */}
    <div className="mt-8 space-y-3">
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-sena-600 rounded-full animate-pulse"></div>
        <span>Leyendo archivo Excel...</span>
      </div>
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-sena-600 rounded-full animate-pulse animation-delay-200"></div>
        <span>Validando registros...</span>
      </div>
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-sena-600 rounded-full animate-pulse animation-delay-400"></div>
        <span>Guardando en base de datos...</span>
      </div>
    </div>
  </motion.div>
)

// Paso 5: Results - 🔧 MEJORADO CON MÁS DETALLES
const ResultsStep: React.FC<{
  results: ImportResult
  onClose: () => void
  onNewImport: () => void
}> = ({ results, onClose, onNewImport }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    {/* Resultado principal */}
    <div className={`p-6 rounded-lg border-2 ${
      results.success 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center">
        {results.success ? (
          <CheckCircleIcon className="h-8 w-8 text-green-600 mr-4" />
        ) : (
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-4" />
        )}
        <div>
          <h4 className={`text-lg font-medium ${
            results.success ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {results.success ? '🎉 ¡Importación Exitosa!' : '⚠️ Importación Completada con Advertencias'}
          </h4>
          <p className={`text-sm mt-1 ${
            results.success ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Se procesaron {results.totalRecords} registros en {(results.executionTime / 1000).toFixed(2)} segundos
          </p>
        </div>
      </div>
    </div>

    {/* 🔧 ESTADÍSTICAS DETALLADAS */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-green-600">{results.importedRecords}</div>
        <div className="text-xs text-gray-600">Importados</div>
      </div>
      
      {(results.recordsUpdated ?? 0) > 0 && results.recordsUpdated !== undefined && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{results.recordsUpdated}</div>
          <div className="text-xs text-gray-600">Actualizados</div>
        </div>
      )}
      
      {results.duplicatesSkipped?.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{results.duplicatesSkipped?.length ?? 0}</div>
          <div className="text-xs text-gray-600">Duplicados</div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className={`text-2xl font-bold ${
          (results.errors?.length || 0) > 0 ? 'text-red-600' : 'text-gray-400'
        }`}>
          {results.errors?.length || 0}
        </div>
        <div className="text-xs text-gray-600">Errores</div>
      </div>
    </div>

    {/* 🔧 RESUMEN DE FICHAS PROCESADAS */}
    {results.summary?.fichasProcessed && results.summary.fichasProcessed.length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Fichas procesadas:</h5>
        <div className="flex flex-wrap gap-2">
          {results.summary.fichasProcessed.map((ficha, index) => (
            <span key={index} className="px-2 py-1 bg-sena-100 text-sena-800 text-xs rounded">
              {ficha}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* 🔧 ERRORES DETALLADOS SI LOS HAY */}
    {results.errors && results.errors.length > 0 && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 className="font-medium text-red-900 mb-3">Errores encontrados:</h5>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {results.errors.slice(0, 5).map((error, index) => (
            <div key={index} className="text-sm text-red-800 bg-red-100 p-2 rounded">
              <span className="font-medium">Fila {error.row}:</span> {error.message}
              {error.field && <span className="text-red-600 ml-1">({error.field})</span>}
            </div>
          ))}
          {results.errors.length > 5 && (
            <p className="text-xs text-red-600 text-center mt-2">
              ... y {results.errors.length - 5} errores más
            </p>
          )}
        </div>
      </div>
    )}

    {/* 🔧 ADVERTENCIAS SI LAS HAY */}
    {results.warnings && results.warnings.length > 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-900 mb-3">Advertencias:</h5>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {results.warnings.slice(0, 3).map((warning, index) => (
            <div key={index} className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
              <span className="font-medium">Fila {warning.row}:</span> {warning.message}
            </div>
          ))}
          {results.warnings.length > 3 && (
            <p className="text-xs text-yellow-600 text-center mt-2">
              ... y {results.warnings.length - 3} advertencias más
            </p>
          )}
        </div>
      </div>
    )}

    {/* 🔧 DUPLICADOS OMITIDOS SI LOS HAY */}
    {results.duplicatesSkipped && results.duplicatesSkipped.length > 0 && (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h5 className="font-medium text-orange-900 mb-3">Registros omitidos (duplicados):</h5>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {results.duplicatesSkipped.slice(0, 3).map((dup, index) => (
            <div key={index} className="text-sm text-orange-800 bg-orange-100 p-2 rounded">
              <span className="font-medium">{dup.documento}:</span> {dup.nombre}
              <span className="text-orange-600 ml-1">({dup.razon})</span>
            </div>
          ))}
          {results.duplicatesSkipped.length > 3 && (
            <p className="text-xs text-orange-600 text-center mt-2">
              ... y {results.duplicatesSkipped.length - 3} duplicados más
            </p>
          )}
        </div>
      </div>
    )}

    {/* Botones */}
    <div className="flex justify-between pt-6 border-t">
      <button
        onClick={onNewImport}
        className="px-4 py-2 text-sm font-medium text-sena-700 bg-sena-50 border border-sena-300 rounded-md hover:bg-sena-100 transition-colors"
      >
        📁 Nueva Importación
      </button>
      <button
        onClick={onClose}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700 transition-colors"
      >
        ✅ Finalizar
      </button>
    </div>
  </motion.div>
)

export default ImportModal