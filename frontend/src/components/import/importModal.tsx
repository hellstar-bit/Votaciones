// 🔧 SOLUCIÓN: ImportModal con overlay corregido
// 📁 frontend/src/components/import/ImportModal.tsx

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

  // 🔧 IMPORTANTE: Solo renderizar si isOpen es true
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* 🔧 SOLUCIÓN: Estructura corregida del modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-y-auto" // ✅ z-index muy alto
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        {/* 🔧 OVERLAY: Fondo semi-transparente */}
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
            onClick={handleClose} // ✅ Permitir cerrar clickeando el overlay
          />

          {/* 🔧 SPACER: Para centrar el modal verticalmente */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* 🔧 MODAL: Contenido principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
            onClick={(e) => e.stopPropagation()} // ✅ Evitar que se cierre al hacer click en el modal
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
                  className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sena-500 transition-colors"
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
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          currentStep === step || (index < (['upload', 'preview', 'importing', 'results'] as ImportStep[]).indexOf(currentStep))
                            ? 'bg-sena-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < 3 && (
                        <div
                          className={`flex-1 h-1 mx-2 transition-colors ${
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
// COMPONENTES DE CADA PASO (manteniendo los existentes)
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
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-sena-500 bg-sena-50'
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
            {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            o <span className="text-sena-600 font-medium">haz clic para seleccionar</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Archivos soportados: .xlsx, .xls (máximo 10MB)
          </p>
        </div>
      )}
    </div>

    {/* Archivo seleccionado */}
    {selectedFile && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
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

    {/* Botón de plantilla */}
    <div className="border-t pt-4">
      <button
        onClick={onDownloadTemplate}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
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

// Paso 2: Preview (mantener el existente pero simplificado)
const PreviewStep: React.FC<{
  previewData: ExcelPreviewResult
  onContinue: () => void
  onBack: () => void
}> = ({ previewData, onContinue, onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900">Vista Previa del Archivo</h4>
      <p className="text-sm text-blue-700 mt-1">
        Se encontraron {previewData.totalRecords} registros en {previewData.sheetsFound} hojas
      </p>
    </div>

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Volver
      </button>
      <button
        onClick={onContinue}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700"
      >
        Continuar
      </button>
    </div>
  </motion.div>
)

// Paso 3: Options (mantener el existente)
const OptionsStep: React.FC<{
  options: ImportOptions
  onOptionsChange: (options: ImportOptions) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
}> = ({ options, onOptionsChange, onContinue, onBack, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <h4 className="font-medium text-gray-900">Opciones de Importación</h4>
    
    <div className="space-y-3">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={options.validateFichas}
          onChange={(e) => onOptionsChange({ ...options, validateFichas: e.target.checked })}
          className="rounded border-gray-300 text-sena-600 focus:ring-sena-500"
        />
        <span className="ml-2 text-sm text-gray-700">Validar fichas existentes</span>
      </label>
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={options.createMissingFichas}
          onChange={(e) => onOptionsChange({ ...options, createMissingFichas: e.target.checked })}
          className="rounded border-gray-300 text-sena-600 focus:ring-sena-500"
        />
        <span className="ml-2 text-sm text-gray-700">Crear fichas faltantes</span>
      </label>
    </div>

    {/* Botones */}
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        Volver
      </button>
      <button
        onClick={onContinue}
        disabled={isLoading}
        className="px-6 py-2 text-sm font-medium text-white bg-sena-600 border border-transparent rounded-md hover:bg-sena-700 disabled:opacity-50"
      >
        {isLoading ? 'Importando...' : 'Importar'}
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
    className="text-center py-8"
  >
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sena-600 mx-auto"></div>
    <h4 className="mt-4 text-lg font-medium text-gray-900">Importando datos...</h4>
    <p className="text-sm text-gray-600 mt-2">
      Por favor espera mientras procesamos los registros
    </p>
  </motion.div>
)

// Paso 5: Results (mantener el existente pero simplificado)
const ResultsStep: React.FC<{
  results: ImportResult
  onClose: () => void
  onNewImport: () => void
}> = ({ results, onClose, onNewImport }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
      <h4 className={`font-medium ${results.success ? 'text-green-900' : 'text-yellow-900'}`}>
        {results.success ? '¡Importación Exitosa!' : 'Importación Completada con Advertencias'}
      </h4>
      <p className={`text-sm mt-1 ${results.success ? 'text-green-700' : 'text-yellow-700'}`}>
        Se importaron {results.importedRecords} de {results.totalRecords} registros
      </p>
    </div>

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