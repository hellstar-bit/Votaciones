// VotingStation.tsx - Actualizado para el nuevo formato de QR y voto por documento
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, candidatesApi, votesApi, handleApiError, type Election, type Candidate } from '../../services/api'
import Button from '../ui/Button'
import QRScanner from './QRScanner'
import VoteConfirmation from './VoteConfirmation'

const VotingStation = () => {
  const [currentStep, setCurrentStep] = useState<'elections' | 'qr-scan' | 'voting' | 'confirmation' | 'success'>('elections')
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [scannedData, setScannedData] = useState<any>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [voteResult, setVoteResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isProcessingQR, setIsProcessingQR] = useState(false)

  // Cargar elecciones activas
  useEffect(() => {
    loadActiveElections()
  }, [])

  const loadActiveElections = async () => {
    try {
      setLoading(true)
      const elections = await electionsApi.getActive()
      setActiveElections(elections)
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando elecciones: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Seleccionar elección y cargar candidatos
  const handleSelectElection = async (election: Election) => {
    try {
      setSelectedElection(election)
      const candidatesData = await candidatesApi.getByElection(election.id_eleccion)
      // Solo candidatos validados
      const validatedCandidates = candidatesData.filter(c => c.estado === 'validado')
      setCandidates(validatedCandidates)
      setCurrentStep('qr-scan')
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando candidatos: ${errorMessage}`)
    }
  }

  // Manejar QR escaneado o documento ingresado
  const handleIdentificationData = (data: any) => {
    // ⭐ PREVENIR EJECUCIONES MÚLTIPLES
    if (isProcessingQR) {
      console.log('🚫 Ya procesando QR, ignorando...')
      return
    }
    
    setIsProcessingQR(true) // ⭐ MARCAR COMO PROCESANDO
    
    try {
      console.log('🔍 Datos de identificación recibidos:', data)
      
      let parsedData = data;
      
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          const match = data.match(/\d{8,12}/);
          if (match) {
            parsedData = { doc: match[0], type: 'QR_DIRECT' };
          } else {
            toast.error('Formato de QR no válido');
            setIsProcessingQR(false) // ⭐ RESET EN ERROR
            return;
          }
        }
      }
      
      const numeroDocumento = parsedData.doc || 
                             parsedData.numero_documento || 
                             parsedData.documento || 
                             parsedData.cedula || 
                             parsedData.id;
      
      if (!numeroDocumento) {
        toast.error(`No se encontró número de documento`)
        setIsProcessingQR(false) // ⭐ RESET EN ERROR
        return
      }

      const processedData = {
        doc: numeroDocumento,
        numero_documento: numeroDocumento,
        type: parsedData.type || 'QR_UNKNOWN',
        id: parsedData.id,
        timestamp: parsedData.timestamp,
        raw_data: data
      }
      
      setScannedData(processedData)
      setCurrentStep('voting')
      
      const metodo = parsedData.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 'QR genérico'
      toast.success(`Identificación por ${metodo}: ${numeroDocumento}`)
      
    } catch (error) {
      console.error('Error procesando datos:', error)
      toast.error('Error procesando datos de identificación')
    } finally {
      // ⭐ RESET DESPUÉS DE UN DELAY PARA PREVENIR REBOTES
      setTimeout(() => {
        setIsProcessingQR(false)
      }, 1000)
    }
  }

  // ⭐ RESET el flag cuando cambies de paso
  useEffect(() => {
    if (currentStep !== 'qr-scan') {
      setIsProcessingQR(false)
    }
  }, [currentStep])

  // Seleccionar candidato o voto en blanco
  const handleCandidateSelection = (candidateId: number | null) => {
    setSelectedCandidate(candidateId)
  }

  // Confirmar voto
  const handleConfirmVote = () => {
    if (selectedCandidate === null && !selectedElection?.permite_voto_blanco) {
      toast.error('Debe seleccionar un candidato')
      return
    }
    setCurrentStep('confirmation')
  }

  // Procesar voto
  const handleProcessVote = async () => {
    if (!selectedElection || !scannedData) {
      toast.error('Faltan datos para procesar el voto')
      return
    }

    try {
      setProcessing(true)
      
      console.log('📤 Enviando voto:', {
        id_eleccion: selectedElection.id_eleccion,
        id_candidato: selectedCandidate,
        datos_identificacion: scannedData
      })
      
      // Preparar datos para el backend
      const voteData = {
        id_eleccion: selectedElection.id_eleccion,
        id_candidato: selectedCandidate,
        qr_code: typeof scannedData === 'string' ? scannedData : JSON.stringify(scannedData)
      }

      const result = await votesApi.cast(voteData)
      console.log('✅ Voto registrado:', result)
      
      setVoteResult(result)
      setCurrentStep('success')
      toast.success('¡Voto registrado exitosamente!')
      
    } catch (error) {
      console.error('❌ Error procesando voto:', error)
      const errorMessage = handleApiError(error)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  // Reiniciar proceso
  const handleRestart = () => {
    setCurrentStep('elections')
    setSelectedElection(null)
    setCandidates([])
    setScannedData(null)
    setSelectedCandidate(null)
    setVoteResult(null)
    loadActiveElections()
  }

  // Volver al paso anterior
  const handleGoBack = () => {
    switch (currentStep) {
      case 'qr-scan':
        setCurrentStep('elections')
        setSelectedElection(null)
        break
      case 'voting':
        setCurrentStep('qr-scan')
        setScannedData(null)
        break
      case 'confirmation':
        setCurrentStep('voting')
        setSelectedCandidate(null)
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mesa de Votación</h1>
          <p className="text-lg text-gray-600">Sistema de Votación Electrónica SENA</p>
        </div>

        {/* Indicador de progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['elections', 'qr-scan', 'voting', 'confirmation', 'success'].map((step, index) => {
              const stepNames = ['Elecciones', 'Identificación', 'Votación', 'Confirmación', 'Resultado']
              const isActive = currentStep === step
              const isCompleted = ['elections', 'qr-scan', 'voting', 'confirmation', 'success'].indexOf(currentStep) > index
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive 
                      ? 'bg-sena-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'text-sena-600 font-medium' : 'text-gray-500'}`}>
                    {stepNames[index]}
                  </span>
                  {index < 4 && (
                    <div className={`ml-4 w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Botón de retroceso */}
        {currentStep !== 'elections' && currentStep !== 'success' && (
          <div className="mb-6">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Atrás
            </Button>
          </div>
        )}

        {/* Contenido principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <AnimatePresence mode="wait">
            {/* Paso 1: Seleccionar Elección */}
            {currentStep === 'elections' && (
              <motion.div
                key="elections"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <ClipboardDocumentListIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleccionar Elección</h2>
                  <p className="text-gray-600">Elige la elección en la que deseas participar</p>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sena-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando elecciones...</p>
                  </div>
                ) : activeElections.length > 0 ? (
                  <div className="grid gap-4">
                    {activeElections.map((election) => (
                      <motion.div
                        key={election.id_eleccion}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-sena-300 hover:shadow-md transition-all"
                        onClick={() => handleSelectElection(election)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {election.titulo}
                            </h3>
                            <p className="text-gray-600 mb-3">{election.descripcion}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>🗳️ {election.tipoEleccion.nombre_tipo}</span>
                              <span>📅 {new Date(election.fecha_inicio).toLocaleDateString()}</span>
                              <span>👥 {election.total_votantes_habilitados} habilitados</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              Activa
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay elecciones activas</h3>
                    <p className="text-gray-500">No hay elecciones disponibles para votar en este momento</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Paso 2: Identificación (QR o Documento) */}
            {currentStep === 'qr-scan' && (
              <motion.div
                key="qr-scan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <UserIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Identificación del Votante</h2>
                  <p className="text-gray-600">Escanea tu QR o ingresa tu número de documento</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-900 mb-2">Elección seleccionada:</h3>
                    <p className="text-blue-700">{selectedElection?.titulo}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedElection?.tipoEleccion.nombre_tipo}
                    </p>
                  </div>
                </div>

                <QRScanner 
                  onScanSuccess={handleIdentificationData}
                  onClose={() => setCurrentStep('elections')} // o la lógica que necesites
                />
              </motion.div>
            )}

            {/* Paso 3: Votación */}
            {currentStep === 'voting' && (
              <motion.div
                key="voting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <QrCodeIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Emitir Voto</h2>
                  <p className="text-gray-600">Selecciona tu candidato preferido</p>
                </div>

                {/* Información del votante */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="text-green-800 font-medium">Votante identificado</p>
                      <p className="text-green-700 text-sm">
                        Documento: {scannedData?.doc || scannedData?.numero_documento}
                        {scannedData?.type && (
                          <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                            {scannedData.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                             scannedData.type === 'MANUAL_INPUT' ? 'Manual' : 'QR'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de candidatos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Candidatos disponibles:</h3>
                  
                  {candidates.map((candidate) => (
                    <motion.div
                      key={candidate.id_candidato}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedCandidate === candidate.id_candidato
                          ? 'border-sena-500 bg-sena-50'
                          : 'border-gray-200 hover:border-sena-300'
                      }`}
                      onClick={() => handleCandidateSelection(candidate.id_candidato)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-sena-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-sena-600 font-bold text-lg">
                              {candidate.numero_lista}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {candidate.persona.nombreCompleto}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Lista #{candidate.numero_lista}
                            </p>
                          </div>
                        </div>
                        {selectedCandidate === candidate.id_candidato && (
                          <CheckCircleIcon className="w-6 h-6 text-sena-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Opción de voto en blanco */}
                  {selectedElection?.permite_voto_blanco && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedCandidate === null
                          ? 'border-gray-500 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCandidateSelection(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                            <XCircleIcon className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Voto en Blanco</h4>
                            <p className="text-sm text-gray-600">No votar por ningún candidato</p>
                          </div>
                        </div>
                        {selectedCandidate === null && (
                          <CheckCircleIcon className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <Button
                  onClick={handleConfirmVote}
                  disabled={selectedCandidate === undefined}
                  className="w-full"
                  size="lg"
                >
                  Continuar a Confirmación
                </Button>
              </motion.div>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <VoteConfirmation
                  election={selectedElection!}
                  candidate={selectedCandidate ? candidates.find(c => c.id_candidato === selectedCandidate) || null : null}
                  voterData={scannedData}
                  onConfirm={handleProcessVote}
                  onCancel={() => setCurrentStep('voting')}
                  isProcessing={processing}
                />
              </motion.div>
            )}

            {/* Paso 5: Éxito */}
            {currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Voto Registrado!</h2>
                  <p className="text-lg text-gray-600 mb-4">Tu voto ha sido registrado exitosamente</p>
                </div>

                {voteResult && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
                    <h3 className="font-semibold text-green-900 mb-3">Detalles del voto:</h3>
                    <div className="space-y-2 text-sm text-green-800">
                      <p><strong>Votante:</strong> {voteResult.votante}</p>
                      <p><strong>Candidato:</strong> {voteResult.candidato}</p>
                      <p><strong>Fecha:</strong> {new Date(voteResult.timestamp).toLocaleString()}</p>
                      <p><strong>Hash de verificación:</strong></p>
                      <code className="text-xs bg-green-100 px-2 py-1 rounded break-all">
                        {voteResult.hash_verificacion}
                      </code>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleRestart}
                  size="lg"
                  className="mx-auto"
                >
                  Nuevo Voto
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default VotingStation