// VotingStation.tsx - Con debugging para fotos
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
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

  // Debug: Logging de candidatos cuando cambian
  useEffect(() => {
    console.log('🔍 Candidatos cargados:', candidates)
    candidates.forEach((candidate, index) => {
      console.log(`Candidato ${index + 1}:`, {
        id: candidate.id_candidato,
        numero_lista: candidate.numero_lista,
        persona: candidate.persona,
        foto_url: candidate.persona?.foto_url,
        tiene_foto: !!candidate.persona?.foto_url
      })
    })
  }, [candidates])

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
      console.log('🗳️ Cargando candidatos para elección:', election.id_eleccion)
      
      const candidatesData = await candidatesApi.getByElection(election.id_eleccion)
      console.log('📊 Candidatos recibidos del API:', candidatesData)
      
      // Solo candidatos validados
      const validatedCandidates = candidatesData.filter(c => c.estado === 'validado')
      console.log('✅ Candidatos validados:', validatedCandidates)
      
      setCandidates(validatedCandidates)
      setCurrentStep('qr-scan')
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando candidatos: ${errorMessage}`)
      console.error('❌ Error cargando candidatos:', error)
    }
  }

  // Manejar QR escaneado o documento ingresado
  const handleIdentificationData = (data: any) => {
  if (isProcessingQR) {
    console.log('🚫 Ya procesando QR, ignorando...')
    return
  }
  
  setIsProcessingQR(true)
  
  try {
    console.log('🔍 Datos recibidos del QR:', data)
    
    let parsedData = data
    
    // ✅ Si los datos son un string JSON, parsearlos
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
        console.log('🔄 JSON parseado exitosamente:', parsedData)
      } catch (parseError) {
        console.log('⚠️ No se pudo parsear JSON, usando como string:', data)
        parsedData = { doc: data, numero_documento: data }
      }
    }
    
    console.log('✅ Datos finales para guardar:', parsedData)
    setScannedData(parsedData)
    setCurrentStep('voting')
    toast.success('Identificación exitosa')
  } catch (error) {
    console.error('❌ Error procesando identificación:', error)
    toast.error('Error procesando los datos de identificación')
  } finally {
    setTimeout(() => {
      setIsProcessingQR(false)
    }, 1000)
  }
}

  // Seleccionar candidato
  const handleCandidateSelection = (candidateId: number | null) => {
    setSelectedCandidate(candidateId)
  }

  // Continuar a confirmación
  const handleContinueToConfirmation = () => {
    if (selectedCandidate === null && !selectedElection?.permite_voto_blanco) {
      toast.error('Debe seleccionar un candidato')
      return
    }
    setCurrentStep('confirmation')
  }

  // Procesar voto
  const handleProcessVote = async () => {
  try {
    setProcessing(true)
    
    // ✅ Obtener documento del QR de forma más robusta
    const documentFromQR = scannedData?.doc || scannedData?.numero_documento
    console.log('📄 Documento del QR:', documentFromQR)
    console.log('📄 Tipo de documento:', typeof documentFromQR)
    console.log('📄 scannedData completo:', scannedData)
    
    // Limpiar y validar
    const cleanDocument = documentFromQR ? documentFromQR.toString().replace(/\D/g, '') : ''
    
    if (!cleanDocument) {
      toast.error('No se pudo obtener el número de documento')
      return
    }
    
    console.log('📄 Documento limpio:', cleanDocument)
    
    const voteData = {
  id_eleccion: selectedElection!.id_eleccion,
  id_candidato: selectedCandidate,
  qr_code: cleanDocument  // Solo enviar qr_code, no numero_documento
}
    
    console.log('📤 Datos a enviar:', voteData)

    const result = await votesApi.cast(voteData)
    setVoteResult(result)
    setCurrentStep('success')
    toast.success('¡Voto registrado exitosamente!')
  } catch (error) {
    const errorMessage = handleApiError(error)
    toast.error(`Error registrando voto: ${errorMessage}`)
    console.error('❌ Error completo:', error)
  } finally {
    setProcessing(false)
  }
}

  // Reiniciar para nuevo voto
  const handleRestart = () => {
    setCurrentStep('elections')
    setSelectedElection(null)
    setCandidates([])
    setScannedData(null)
    setSelectedCandidate(null)
    setVoteResult(null)
    setIsProcessingQR(false)
  }

  // Función para obtener la URL de la foto del candidato - CON DEBUG
  const getCandidatePhotoUrl = (candidate: Candidate) => {
    console.log('📸 Procesando foto para candidato:', candidate.persona?.nombres, candidate.persona?.apellidos)
    console.log('📸 foto_url original:', candidate.persona?.foto_url)
    
    if (candidate.persona?.foto_url) {
      let finalUrl: string
      
      // Si la URL ya incluye el dominio, usarla tal como está
      if (candidate.persona.foto_url.startsWith('http')) {
        finalUrl = candidate.persona.foto_url
      } else {
        // Si es una ruta relativa, agregar el baseURL del API
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
        finalUrl = `${baseUrl}${candidate.persona.foto_url}`
      }
      
      console.log('📸 URL final construida:', finalUrl)
      return finalUrl
    }
    
    console.log('📸 No hay foto_url para este candidato')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sena-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sistema de votación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header con progreso */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Mesa de Votación</h1>
              <div className="text-sm text-gray-500">
                Sistema de Votación Electrónica SENA
              </div>
            </div>

            {/* Indicador de progreso */}
            <div className="flex items-center justify-between">
              {[
                { step: 'elections', label: 'Elecciones', icon: ClipboardDocumentListIcon },
                { step: 'qr-scan', label: 'Identificación', icon: QrCodeIcon },
                { step: 'voting', label: 'Votación', icon: UserIcon },
                { step: 'confirmation', label: 'Confirmación', icon: CheckCircleIcon },
                { step: 'success', label: 'Resultado', icon: CheckCircleIcon }
              ].map((item, index) => {
                const isActive = currentStep === item.step
                const isCompleted = ['elections', 'qr-scan', 'voting', 'confirmation', 'success'].indexOf(currentStep) > index
                const Icon = item.icon

                return (
                  <div key={item.step} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'border-sena-500 bg-sena-500 text-white' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      isActive ? 'text-sena-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                    {index < 4 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          

          {/* Contenido principal */}
          <AnimatePresence mode="wait">
            {/* Paso 1: Selección de elección */}
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

                {activeElections.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">No hay elecciones activas</h3>
                    <p className="text-yellow-700">No hay elecciones disponibles en este momento.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeElections.map((election) => (
                      <motion.div
                        key={election.id_eleccion}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-sena-300 transition-colors"
                        onClick={() => handleSelectElection(election)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{election.titulo}</h3>
                            <p className="text-gray-600 mt-1">{election.descripcion}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span>Finaliza: {new Date(election.fecha_fin).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-sena-500">
                            <ClipboardDocumentListIcon className="w-6 h-6" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Paso 2: Escaneo QR */}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Identificación</h2>
                  <p className="text-gray-600">
                    Escanea tu código QR o ingresa tu documento manualmente
                  </p>
                </div>

                <QRScanner 
                  onScanSuccess={handleIdentificationData}
                  onClose={() => setCurrentStep('elections')}
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
                  
                  {candidates.map((candidate) => {
                    const photoUrl = getCandidatePhotoUrl(candidate)
                    
                    return (
                      <motion.div
                        key={candidate.id_candidato}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                          selectedCandidate === candidate.id_candidato
                            ? 'border-sena-500 bg-sena-50'
                            : 'border-gray-200 hover:border-sena-300'
                        }`}
                        onClick={() => handleCandidateSelection(candidate.id_candidato)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Número de lista */}
                            <div className="w-16 h-16 bg-sena-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sena-600 font-bold text-xl">
                                {candidate.numero_lista}
                              </span>
                            </div>
                            
                            {/* Foto del candidato - CON DEBUG */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 relative">
                              {photoUrl ? (
                                <>
                                  <img
                                    src={photoUrl}
                                    alt={`Foto de ${candidate.persona.nombres} ${candidate.persona.apellidos}`}
                                    className="w-full h-full object-cover"
                                    onLoad={() => {
                                      console.log('✅ Imagen cargada exitosamente:', photoUrl)
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Error cargando imagen:', photoUrl)
                                      console.error('Error details:', e)
                                      
                                      // Si falla la carga de la imagen, mostrar avatar por defecto
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full bg-red-100 flex items-center justify-center border-2 border-red-300">
                                            <div class="text-center">
                                              <svg class="w-8 h-8 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                              </svg>
                                              <span class="text-xs text-red-600 mt-1 block">Error</span>
                                            </div>
                                          </div>
                                        `
                                      }
                                    }}
                                  />
                                  
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <div className="text-center">
                                    <UserIcon className="w-8 h-8 text-gray-400 mx-auto" />
                                    <span className="text-xs text-gray-400 mt-1 block">Sin foto</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Información del candidato */}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {candidate.persona.nombres} {candidate.persona.apellidos}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Lista #{candidate.numero_lista}
                              </p>
                              {candidate.persona.email && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {candidate.persona.email}
                                </p>
                              )}
                             
                            </div>
                          </div>
                          
                          {/* Indicador de selección */}
                          {selectedCandidate === candidate.id_candidato && (
                            <CheckCircleIcon className="w-8 h-8 text-sena-500 flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Opción de voto en blanco */}
                  {selectedElection?.permite_voto_blanco && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        selectedCandidate === null
                          ? 'border-gray-500 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCandidateSelection(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <XCircleIcon className="w-8 h-8 text-gray-500" />
                          </div>
                          <div className="w-20 h-20 rounded-xl border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                            <div className="text-center">
                              <XCircleIcon className="w-8 h-8 text-gray-400 mx-auto" />
                              <span className="text-xs text-gray-400 mt-1">Sin foto</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">Voto en Blanco</h4>
                            <p className="text-sm text-gray-600 mt-1">No votar por ningún candidato</p>
                          </div>
                        </div>
                        {selectedCandidate === null && (
                          <CheckCircleIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Botón continuar */}
                <div className="pt-6">
                  <Button
                    onClick={handleContinueToConfirmation}
                    disabled={selectedCandidate === null && !selectedElection?.permite_voto_blanco}
                    size="lg"
                    className="w-full bg-sena-600 hover:bg-sena-700"
                  >
                    Continuar a Confirmación
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 'confirmation' && selectedElection && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
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