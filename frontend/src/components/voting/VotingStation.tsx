// VotingStation.tsx
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

  // Manejar QR escaneado
  const handleQRScanned = (data: any) => {
    try {
      // El QR debe contener el documento de la persona
      const qrData = typeof data === 'string' ? JSON.parse(data) : data
      
      if (!qrData.numero_documento) {
        toast.error('QR inválido: no contiene número de documento')
        return
      }

      setScannedData(qrData)
      setCurrentStep('voting')
      toast.success(`QR escaneado: ${qrData.numero_documento}`)
    } catch (error) {
      toast.error('Error leyendo código QR')
    }
  }

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
      
      const voteData = {
        id_eleccion: selectedElection.id_eleccion,
        id_candidato: selectedCandidate,
        qr_code: JSON.stringify(scannedData),
        ip_address: '127.0.0.1', // En producción, obtener IP real
        user_agent: navigator.userAgent
      }

      const result = await votesApi.cast(voteData)
      setVoteResult(result)
      setCurrentStep('success')
      toast.success('¡Voto registrado exitosamente!')
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error registrando voto: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  // Reiniciar proceso
  const handleNewVote = () => {
    setCurrentStep('elections')
    setSelectedElection(null)
    setCandidates([])
    setScannedData(null)
    setSelectedCandidate(null)
    setVoteResult(null)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sena-50 to-green-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sena-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sena-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {currentStep !== 'elections' && currentStep !== 'success' && (
                <Button
                  variant="ghost"
                  onClick={handleGoBack}
                  icon={<ArrowLeftIcon className="w-4 h-4" />}
                >
                  Volver
                </Button>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sena-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mesa de Votación</h1>
                  <p className="text-sm text-gray-500">Sistema SENA</p>
                </div>
              </div>
            </div>

            {/* Indicador de paso actual */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
              <div className={`w-2 h-2 rounded-full ${
                currentStep === 'elections' ? 'bg-sena-500' : 'bg-gray-300'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                currentStep === 'qr-scan' ? 'bg-sena-500' : 'bg-gray-300'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                currentStep === 'voting' ? 'bg-sena-500' : 'bg-gray-300'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                currentStep === 'confirmation' ? 'bg-sena-500' : 'bg-gray-300'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                currentStep === 'success' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

              {activeElections.length > 0 ? (
                <div className="grid gap-4">
                  {activeElections.map((election, index) => (
                    <motion.div
                      key={election.id_eleccion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl border-2 border-gray-200 hover:border-sena-300 transition-all cursor-pointer p-6"
                      onClick={() => handleSelectElection(election)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{election.titulo}</h3>
                          <p className="text-sm text-gray-600 mt-1">{election.descripcion}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>Tipo: {election.tipoEleccion?.nombre_tipo}</span>
                            <span>•</span>
                            <span>Termina: {new Date(election.fecha_fin).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mb-2">
                            Activa
                          </div>
                          <p className="text-sm text-gray-500">
                            {election.total_votos_emitidos}/{election.total_votantes_habilitados} votos
                          </p>
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

          {/* Paso 2: Escanear QR */}
          {currentStep === 'qr-scan' && (
            <motion.div
              key="qr-scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <QrCodeIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Escanear QR</h2>
                <p className="text-gray-600">Escanea tu código QR de estudiante para autenticarte</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Elección seleccionada:</h3>
                  <p className="text-sena-600">{selectedElection?.titulo}</p>
                </div>

                <QRScanner onScan={handleQRScanned} />
              </div>
            </motion.div>
          )}

          {/* Paso 3: Votar */}
          {currentStep === 'voting' && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <UserIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleccionar Candidato</h2>
                <p className="text-gray-600">Elige tu candidato preferido</p>
              </div>

              {/* Información del votante */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-sena-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-sena-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Votante autenticado</p>
                    <p className="text-sm text-gray-500">Documento: {scannedData?.numero_documento}</p>
                  </div>
                  <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />
                </div>
              </div>

              {/* Lista de candidatos */}
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id_candidato}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-xl border-2 transition-all cursor-pointer p-4 ${
                      selectedCandidate === candidate.id_candidato
                        ? 'border-sena-500 bg-sena-50'
                        : 'border-gray-200 hover:border-sena-300'
                    }`}
                    onClick={() => handleCandidateSelection(candidate.id_candidato)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-sena-100 rounded-full flex items-center justify-center">
                          <span className="text-sena-600 font-semibold">
                            {candidate.persona.nombres.charAt(0)}{candidate.persona.apellidos.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {candidate.persona.nombreCompleto}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Documento: {candidate.persona.numero_documento}
                          </p>
                        </div>
                      </div>
                      {selectedCandidate === candidate.id_candidato && (
                        <CheckCircleIcon className="w-6 h-6 text-sena-500" />
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Voto en blanco */}
                {selectedElection?.permite_voto_blanco && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: candidates.length * 0.1 }}
                    className={`bg-white rounded-xl border-2 transition-all cursor-pointer p-4 ${
                      selectedCandidate === null && scannedData
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                    onClick={() => handleCandidateSelection(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <XCircleIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Voto en Blanco</h3>
                          <p className="text-sm text-gray-500">No apoyar a ningún candidato</p>
                        </div>
                      </div>
                      {selectedCandidate === null && scannedData && (
                        <CheckCircleIcon className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Botón confirmar */}
              <div className="text-center">
                <Button
                  onClick={handleConfirmVote}
                  disabled={selectedCandidate === undefined}
                  className="px-8 py-3 text-lg"
                >
                  Confirmar Selección
                </Button>
              </div>
            </motion.div>
          )}

          {/* Paso 4: Confirmación */}
          {currentStep === 'confirmation' && (
            <VoteConfirmation
              election={selectedElection}
              candidate={candidates.find(c => c.id_candidato === selectedCandidate)}
              isBlankVote={selectedCandidate === null}
              onConfirm={handleProcessVote}
              onCancel={() => setCurrentStep('voting')}
              processing={processing}
            />
          )}

          {/* Paso 5: Éxito */}
          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
              </motion.div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Voto Registrado!</h2>
                <p className="text-gray-600 text-lg">Tu participación ha sido registrada exitosamente</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Elección:</span>
                    <span className="font-medium">{selectedElection?.titulo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hash de verificación:</span>
                    <span className="font-mono text-xs">{voteResult?.hash_verificacion?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timestamp:</span>
                    <span className="font-medium">
                      {voteResult?.timestamp ? new Date(voteResult.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Tu voto es secreto y anónimo. Guarda el hash de verificación para futuras consultas.
                </p>
                
                <Button
                  onClick={handleNewVote}
                  className="px-8 py-3"
                >
                  Nuevo Voto
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default VotingStation