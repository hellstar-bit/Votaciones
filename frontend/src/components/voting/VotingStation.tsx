// VotingStation.tsx - Versión completa con ambos métodos de identificación
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, candidatesApi, votesApi, handleApiError, type Election, type Candidate, personasApi } from '../../services/api'
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

  // Manejar datos de identificación (QR o manual) - ACTUALIZADO
  const handleIdentificationData = async (data: any) => {
  if (isProcessingQR) {
    console.log('🚫 Ya procesando identificación, ignorando...')
    return
  }
  
  setIsProcessingQR(true)
  
  try {
    console.log('🔍 Datos recibidos:', data)
    
    let parsedData = data
    
    // ✅ Si los datos son un string, intentar parsearlo como JSON
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
        console.log('🔄 JSON parseado exitosamente:', parsedData)
      } catch (parseError) {
        console.log('⚠️ No es JSON, tratando como documento directo:', data)
        parsedData = { 
          type: 'DIRECT_INPUT',
          doc: data, 
          numero_documento: data,
          timestamp: Date.now()
        }
      }
    }
    
    // ✅ Asegurar que tenemos el documento
    const documento = parsedData?.doc || parsedData?.numero_documento
    if (!documento) {
      toast.error('No se pudo obtener el número de documento')
      return
    }

    // ✅ BUSCAR INFORMACIÓN DEL VOTANTE POR DOCUMENTO
    try {
      console.log('🔍 Buscando información del votante:', documento)
      const personaInfo = await personasApi.getByDocumento(documento)
      
      // Agregar información del votante a los datos escaneados
      parsedData = {
        ...parsedData,
        persona_info: {
          nombre_completo: personaInfo.nombreCompleto,
          nombres: personaInfo.nombres,
          apellidos: personaInfo.apellidos,
          documento: personaInfo.numero_documento,
          email: personaInfo.email,
          telefono: personaInfo.telefono
        }
      }
      
      console.log('✅ Información del votante encontrada:', personaInfo.nombreCompleto)
      
    } catch (error) {
      console.warn('⚠️ No se pudo obtener información completa del votante:', error)
      // Continuar con solo el documento
      parsedData = {
        ...parsedData,
        persona_info: {
          nombre_completo: 'Votante',
          documento: documento
        }
      }
    }
    
    console.log('✅ Datos finales para guardar:', parsedData)
    setScannedData(parsedData)
    setCurrentStep('voting')
    
    // Mostrar mensaje específico según el método
    const metodo = parsedData?.type === 'MANUAL_INPUT' ? 'Ingreso Manual' : 
                   parsedData?.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                   parsedData?.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
                   'QR'
    
    const nombreVotante = parsedData?.persona_info?.nombre_completo || 'Votante'
    toast.success(`Bienvenido ${nombreVotante} (${metodo})`)
    
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

  // Procesar voto - ACTUALIZADO para manejar ambos métodos
  const handleProcessVote = async () => {
  try {
    setProcessing(true)
    
    console.log('🎯 Iniciando procesamiento de voto...')
    console.log('📄 Datos escaneados:', scannedData)
    console.log('🗳️ Elección seleccionada:', selectedElection?.id_eleccion)
    console.log('👤 Candidato seleccionado:', selectedCandidate)
    
    // ✅ FUNCIÓN HELPER PARA CONVERTIR A BASE64 (navegador)
    const encodeToBase64 = (data: any) => {
      try {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
        return btoa(unescape(encodeURIComponent(jsonString)))
      } catch (error) {
        console.error('❌ Error en encodeToBase64:', error)
        throw new Error('Error codificando datos a base64')
      }
    }
    
    // ✅ FUNCIÓN HELPER PARA DECODIFICAR BASE64 (verificación)
    const decodeFromBase64 = (base64String: string) => {
      try {
        const jsonString = decodeURIComponent(escape(atob(base64String)))
        return JSON.parse(jsonString)
      } catch (error) {
        console.error('❌ Error en decodeFromBase64:', error)
        return null
      }
    }
    
    // ✅ PREPARAR DATOS SEGÚN EL MÉTODO DE IDENTIFICACIÓN
    let qrCodeData: string
    let finalData: any
    
    if (scannedData?.type === 'MANUAL_INPUT' || typeof scannedData === 'string') {
      // Para ingreso manual, crear estructura JSON esperada por el backend
      finalData = {
        numero_documento: scannedData?.doc || scannedData?.numero_documento || scannedData,
        type: 'MANUAL_INPUT',
        timestamp: new Date().toISOString(),
        persona_info: scannedData?.persona_info || {
          nombre_completo: 'Votante',
          documento: scannedData?.doc || scannedData?.numero_documento || scannedData
        }
      }
      
      console.log('📝 Datos preparados para ingreso manual:', finalData)
      
    } else if (scannedData?.type === 'ACCESUM_SENA_LEARNER') {
      // Para QR del SENA, usar estructura específica
      finalData = {
        numero_documento: scannedData.doc || scannedData.numero_documento,
        type: 'ACCESUM_SENA_LEARNER',
        timestamp: new Date().toISOString(),
        persona_info: scannedData.persona_info || {
          nombre_completo: scannedData.nombre || 'Estudiante SENA',
          documento: scannedData.doc || scannedData.numero_documento
        },
        // Mantener datos originales del QR SENA
        ...scannedData
      }
      
      console.log('🎓 Datos preparados para QR SENA:', finalData)
      
    } else if (typeof scannedData === 'object' && scannedData !== null) {
      // Para otros tipos de QR o datos estructurados
      finalData = {
        ...scannedData,
        numero_documento: scannedData.numero_documento || scannedData.doc,
        timestamp: scannedData.timestamp || new Date().toISOString()
      }
      
      console.log('📱 Datos preparados para QR genérico:', finalData)
      
    } else {
      // Fallback para casos no previstos
      const documento = scannedData?.toString() || ''
      finalData = {
        numero_documento: documento,
        type: 'UNKNOWN',
        timestamp: new Date().toISOString(),
        persona_info: {
          nombre_completo: 'Votante',
          documento: documento
        }
      }
      
      console.log('⚠️ Datos preparados con fallback:', finalData)
    }
    
    // ✅ VALIDAR QUE TENEMOS EL NÚMERO DE DOCUMENTO
    if (!finalData.numero_documento) {
      console.error('❌ No se encontró número de documento en los datos')
      toast.error('No se pudo obtener el número de documento del votante')
      return
    }
    
    // ✅ CONVERTIR A BASE64 COMO ESPERA EL BACKEND
    qrCodeData = encodeToBase64(finalData)
    console.log('📤 QR Code final (base64):', qrCodeData)
    
    // ✅ VERIFICAR QUE SE PUEDE DECODIFICAR CORRECTAMENTE
    const testDecode = decodeFromBase64(qrCodeData)
    console.log('🧪 Test de decodificación:', testDecode)
    
    if (!testDecode?.numero_documento) {
      console.error('❌ Error en la verificación de decodificación')
      toast.error('Error en el formato de los datos de identificación')
      return
    }
    
    // ✅ PREPARAR DATOS PARA EL API
    const voteData = {
      id_eleccion: selectedElection!.id_eleccion,
      id_candidato: selectedCandidate, // null para voto en blanco
      qr_code: qrCodeData
    }
    
    console.log('📤 VoteData final enviado al backend:', voteData)
    
    // ✅ ENVIAR VOTO AL BACKEND
    const result = await votesApi.cast(voteData)
    console.log('✅ Respuesta del backend:', result)
    
    // ✅ AGREGAR INFORMACIÓN DEL VOTANTE AL RESULTADO
    const enhancedResult = {
      ...result,
      votante_info: {
        nombre_completo: finalData.persona_info?.nombre_completo || 'Votante',
        documento: finalData.numero_documento,
        metodo: finalData.type === 'MANUAL_INPUT' ? 'Ingreso Manual' : 
               finalData.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
               finalData.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
               'QR Genérico'
      }
    }
    
    // ✅ ACTUALIZAR ESTADO Y MOSTRAR ÉXITO
    setVoteResult(enhancedResult)
    setCurrentStep('success')
    
    const nombreVotante = finalData.persona_info?.nombre_completo || 'Votante'
    toast.success(`¡Voto registrado exitosamente para ${nombreVotante}!`)
    
    console.log('🎉 Voto procesado exitosamente')
    
  } catch (error: unknown) {
    console.error('❌ Error completo registrando voto:', error)
    
    // Manejar errores específicos con type guards
    let errorMessage = 'Error inesperado registrando el voto'
    
    // Type guard para errores de Axios
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      }
    } 
    // Type guard para errores normales
    else if (error instanceof Error) {
      errorMessage = error.message
    } 
    // Usar handleApiError como fallback
    else {
      errorMessage = handleApiError(error)
    }
    
    toast.error(`Error registrando voto: ${errorMessage}`)
    
    // Log adicional para debug con type safety
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      console.error('📋 Detalles del error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
        scannedData: scannedData,
        selectedElection: selectedElection?.id_eleccion,
        selectedCandidate: selectedCandidate
      })
    } else {
      console.error('📋 Error genérico:', {
        error: error,
        scannedData: scannedData,
        selectedElection: selectedElection?.id_eleccion,
        selectedCandidate: selectedCandidate
      })
    }
    
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

  // Función para obtener la URL de la foto del candidato
  const getCandidatePhotoUrl = (candidate: Candidate) => {
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
      
      return finalUrl
    }
    
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
                {selectedElection && `Elección: ${selectedElection.titulo}`}
              </div>
            </div>

            {/* Indicador de progreso */}
            <div className="flex items-center space-x-4">
              {['elections', 'qr-scan', 'voting', 'confirmation', 'success'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    currentStep === step 
                      ? 'bg-sena-500 text-white' 
                      : index < ['elections', 'qr-scan', 'voting', 'confirmation', 'success'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      index < ['elections', 'qr-scan', 'voting', 'confirmation', 'success'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="bg-white rounded-xl shadow-sm p-6">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona una Elección</h2>
                    <p className="text-gray-600">Escoge la elección en la que deseas votar</p>
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

              {/* Paso 2: Identificación (QR o Manual) */}
              {currentStep === 'qr-scan' && (
                <motion.div
                  key="qr-scan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <IdentificationIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Identificación de Votante</h2>
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
                    <UserIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Emitir Voto</h2>
                    <p className="text-gray-600">Selecciona tu candidato preferido</p>
                  </div>

                  {/* Información del votante - ACTUALIZADA */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                        <div className="flex-1">
                          <p className="text-green-800 font-medium">Votante identificado</p>
                          <div className="space-y-1">
                            {/* ✅ MOSTRAR NOMBRE COMPLETO SI ESTÁ DISPONIBLE */}
                            {scannedData?.persona_info?.nombre_completo && (
                              <p className="text-green-900 font-semibold text-lg">
                                {scannedData.persona_info.nombre_completo}
                              </p>
                            )}
                            <p className="text-green-700 text-sm">
                              Documento: {scannedData?.doc || scannedData?.numero_documento}
                              {scannedData?.type && (
                                <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                                  {scannedData.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                                  scannedData.type === 'MANUAL_INPUT' ? 'Ingreso Manual' : 
                                  scannedData.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
                                  'QR'}
                                </span>
                              )}
                            </p>
                            {/* ✅ MOSTRAR INFORMACIÓN ADICIONAL SI ESTÁ DISPONIBLE */}
                            {scannedData?.persona_info?.email && (
                              <p className="text-green-600 text-xs">
                                Email: {scannedData.persona_info.email}
                              </p>
                            )}
                          </div>
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
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleCandidateSelection(candidate.id_candidato)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={candidate.persona.nombreCompleto}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    console.log('❌ Error cargando imagen:', photoUrl)
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {candidate.persona.nombreCompleto}
                                </h4>
                                <span className="bg-sena-100 text-sena-800 px-3 py-1 rounded-full text-sm font-medium">
                                  #{candidate.numero_lista}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">
                                Documento: {candidate.persona.numero_documento}
                              </p>
                            </div>
                            {selectedCandidate === candidate.id_candidato && (
                              <CheckCircleIcon className="w-8 h-8 text-sena-500" />
                            )}
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Opción voto en blanco */}
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
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                            <XCircleIcon className="w-8 h-8 text-gray-500" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-lg font-semibold text-gray-900">Voto en Blanco</h4>
                            <p className="text-gray-600 text-sm">No votar por ningún candidato</p>
                          </div>
                          {selectedCandidate === null && (
                            <CheckCircleIcon className="w-8 h-8 text-gray-500" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Botón continuar */}
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('qr-scan')}
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={handleContinueToConfirmation}
                      disabled={selectedCandidate === undefined}
                    >
                      Continuar
                    </Button>
                  </div>
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
                      candidate={selectedCandidate !== null ? candidates.find(c => c.id_candidato === selectedCandidate) || null : null}
                      voterData={scannedData}  // ✅ CORRECTO
                      onConfirm={handleProcessVote}
                      onCancel={() => setCurrentStep('voting')}  // ✅ CORRECTO
                      isProcessing={processing}  // ✅ CORRECTO
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
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Voto Registrado!</h2>
                    <p className="text-gray-600">Tu voto ha sido registrado exitosamente</p>
                  </div>

                  {voteResult && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="space-y-3">
                        <div className="border-b border-green-200 pb-3">
                          <h4 className="font-semibold text-green-800">Información del Voto</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-green-600 font-medium">Votante:</p>
                            <p className="text-green-800">
                              {voteResult.votante_info?.nombre_completo || voteResult.votante}
                            </p>
                            <p className="text-green-600 text-xs">
                              Doc: {voteResult.votante_info?.documento}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-green-600 font-medium">Candidato:</p>
                            <p className="text-green-800">{voteResult.candidato}</p>
                          </div>
                          
                          <div>
                            <p className="text-green-600 font-medium">Método:</p>
                            <p className="text-green-800">
                              {voteResult.votante_info?.metodo || voteResult.metodo_identificacion}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-green-600 font-medium">Fecha:</p>
                            <p className="text-green-800">
                              {new Date(voteResult.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border-t border-green-200 pt-3">
                          <p className="text-green-600 font-medium text-xs">Hash de verificación:</p>
                          <p className="text-green-800 font-mono text-xs break-all">
                            {voteResult.hash_verificacion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleRestart} className="w-full">
                    Realizar Nuevo Voto
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VotingStation