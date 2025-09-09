// 📁 frontend/src/components/voting/VotingStation.tsx - MODIFICADO
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { electionsApi, candidatesApi, votesApi, handleApiError, personasApi, fichasApi, type Election, type Candidate } from '../../services/api'
import Button from '../ui/Button'
import QRScanner from './QRScanner'
import VoteConfirmation from './VoteConfirmation'

// ✅ NUEVA INTERFAZ PARA VOTANTE VALIDADO
interface ValidatedVoter {
  numero_documento: string
  numero_ficha: string
  nombres: string
  apellidos: string
  id_persona: number
  ficha_info: {
    numero_ficha: string
    nombre_programa: string
    jornada: string
  }
}

const VotingStation = () => {
  // ✅ ACTUALIZAR ESTADOS PARA INCLUIR VALIDACIÓN POR FICHA
  const [currentStep, setCurrentStep] = useState<'elections' | 'identification-method' | 'qr-scan' | 'ficha-validation' | 'voting' | 'confirmation' | 'success'>('elections')
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [scannedData, setScannedData] = useState<any>(null)
  const [validatedVoter, setValidatedVoter] = useState<ValidatedVoter | null>(null) // ✅ NUEVO
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [voteResult, setVoteResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isProcessingQR, setIsProcessingQR] = useState(false)

  // ✅ NUEVOS ESTADOS PARA VALIDACIÓN FICHA + DOCUMENTO
  const [fichaValidationStep, setFichaValidationStep] = useState<'ficha' | 'documento' | 'confirmed'>('ficha')
  const [fichaNumber, setFichaNumber] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [fichaInfo, setFichaInfo] = useState<any>(null)
  const [validationError, setValidationError] = useState('')
  const [validationLoading, setValidationLoading] = useState(false)

  // ✅ CARGAR ELECCIONES (mantener igual)
  useEffect(() => {
    loadActiveElections()
  }, [])

  const loadActiveElections = async () => {
    try {
      setLoading(true)
      const elections = await electionsApi.getActive()
      
      // ✅ FILTRAR SOLO ELECCIONES DE REPRESENTANTE DE CENTRO
      const representanteCentroElections = elections.filter(
        election => election.tipoEleccion.nombre_tipo === 'REPRESENTANTE_CENTRO'
      )
      
      setActiveElections(representanteCentroElections)
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando elecciones: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ SELECCIONAR ELECCIÓN (mantener igual)
  const handleSelectElection = async (election: Election) => {
    try {
      setSelectedElection(election)
      console.log('Cargando candidatos para elección:', election.id_eleccion)
      
      const candidatesData = await candidatesApi.getByElection(election.id_eleccion)
      const validatedCandidates = candidatesData.filter(c => c.estado === 'validado')
      
      setCandidates(validatedCandidates)
      setCurrentStep('identification-method') // ✅ CAMBIO: ir a selección de método
    } catch (error) {
      const errorMessage = handleApiError(error)
      toast.error(`Error cargando candidatos: ${errorMessage}`)
    }
  }

  // ✅ NUEVA FUNCIÓN: Manejar selección de método de identificación
  const handleIdentificationMethodSelect = (method: 'qr' | 'ficha-documento') => {
    if (method === 'qr') {
      setCurrentStep('qr-scan')
    } else {
      setCurrentStep('ficha-validation')
      // Reiniciar estados de validación
      setFichaValidationStep('ficha')
      setFichaNumber('')
      setDocumentNumber('')
      setFichaInfo(null)
      setValidationError('')
    }
  }

  // ✅ NUEVA FUNCIÓN: Validar ficha
  const validateFicha = async () => {
    if (!fichaNumber.trim()) {
      setValidationError('Ingrese un número de ficha válido')
      return
    }

    try {
      setValidationLoading(true)
      setValidationError('')

      const response = await fichasApi.validate(fichaNumber.trim())
      
      if (response.exists && response.ficha) {
        setFichaInfo(response.ficha)
        setFichaValidationStep('documento')
        toast.success(`Ficha ${fichaNumber} encontrada`)
      } else {
        setValidationError(`La ficha ${fichaNumber} no existe en el sistema`)
      }
    } catch (error) {
      setValidationError('Error validando la ficha. Intente nuevamente.')
      console.error('Error validando ficha:', error)
    } finally {
      setValidationLoading(false)
    }
  }

  // ✅ NUEVA FUNCIÓN: Validar documento en ficha
  const validateDocument = async () => {
    if (!documentNumber.trim()) {
      setValidationError('Ingrese un número de documento válido')
      return
    }

    try {
      setValidationLoading(true)
      setValidationError('')

      // Validar documento en ficha específica
      const validateResponse = await personasApi.validateInFicha({
        numero_ficha: fichaNumber.trim(),
        numero_documento: documentNumber.trim()
      })

      if (validateResponse.exists && validateResponse.persona) {
        // Verificar si ya votó
        const votingStatusResponse = await personasApi.checkVotingStatus({
          numero_documento: documentNumber.trim(),
          electionId: selectedElection!.id_eleccion
        })

        if (votingStatusResponse.hasVoted) {
          setValidationError(`Esta persona ya votó en esta elección el ${new Date(votingStatusResponse.fechaVoto).toLocaleString()}`)
          return
        }

        // Verificar voto cruzado para Representante de Centro
        const crossVoteResponse = await personasApi.checkCrossVote({
          numero_documento: documentNumber.trim(),
          electionId: selectedElection!.id_eleccion
        })

        if (crossVoteResponse.hasVotedInOtherJornada) {
          setValidationError(`Esta persona ya votó en la jornada ${crossVoteResponse.previousVote.jornada} de Representante de Centro`)
          return
        }

        // Todo OK - crear datos del votante validado
        const validatedVoterData: ValidatedVoter = {
          numero_documento: validateResponse.persona.numero_documento,
          numero_ficha: fichaNumber.trim(),
          nombres: validateResponse.persona.nombres,
          apellidos: validateResponse.persona.apellidos,
          id_persona: validateResponse.persona.id_persona,
          ficha_info: {
            numero_ficha: fichaInfo.numero_ficha,
            nombre_programa: fichaInfo.nombre_programa,
            jornada: fichaInfo.jornada
          }
        }

        setValidatedVoter(validatedVoterData)
        setFichaValidationStep('confirmed')
        toast.success('Votante validado correctamente')

      } else {
        setValidationError(`El documento ${documentNumber} no existe en la ficha ${fichaNumber}`)
      }
    } catch (error) {
      setValidationError('Error validando el documento. Intente nuevamente.')
      console.error('Error validando documento:', error)
    } finally {
      setValidationLoading(false)
    }
  }

  // ✅ NUEVA FUNCIÓN: Proceder a votar desde validación ficha
  const proceedToVoteFromFicha = () => {
    if (!validatedVoter) return
    
    // Crear datos simulando estructura QR para compatibilidad
    const simulatedQRData = {
      type: 'FICHA_DOCUMENTO_VALIDATION',
      numero_documento: validatedVoter.numero_documento,
      numero_ficha: validatedVoter.numero_ficha,
      persona_info: {
        nombre_completo: `${validatedVoter.nombres} ${validatedVoter.apellidos}`,
        nombres: validatedVoter.nombres,
        apellidos: validatedVoter.apellidos,
        documento: validatedVoter.numero_documento,
        id_persona: validatedVoter.id_persona
      },
      ficha_info: validatedVoter.ficha_info,
      timestamp: new Date().toISOString()
    }
    
    setScannedData(simulatedQRData)
    setCurrentStep('voting')
    toast.success(`Bienvenido ${validatedVoter.nombres} ${validatedVoter.apellidos}`)
  }

  // ✅ MANTENER FUNCIÓN ORIGINAL DE QR (sin cambios)
  const handleIdentificationData = async (data: any) => {
    if (isProcessingQR) {
      console.log('Ya procesando identificación, ignorando...')
      return
    }
    
    setIsProcessingQR(true)
    
    try {
      console.log('Datos recibidos:', data)
      
      let parsedData = data
      
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data)
          console.log('JSON parseado exitosamente:', parsedData)
        } catch (parseError) {
          console.log('No es JSON, tratando como documento directo:', data)
          parsedData = { 
            type: 'DIRECT_INPUT',
            doc: data, 
            numero_documento: data,
            timestamp: Date.now()
          }
        }
      }
      
      const documento = parsedData?.doc || parsedData?.numero_documento
      if (!documento) {
        toast.error('No se pudo obtener el número de documento')
        return
      }

      try {
        console.log('Buscando información del votante:', documento)
        const personaInfo = await personasApi.getByDocumento(documento)
        
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
        
        console.log('Información del votante encontrada:', personaInfo.nombreCompleto)
        
      } catch (error) {
        console.warn('No se pudo obtener información completa del votante:', error)
        parsedData = {
          ...parsedData,
          persona_info: {
            nombre_completo: 'Votante',
            documento: documento
          }
        }
      }
      
      console.log('Datos finales para guardar:', parsedData)
      setScannedData(parsedData)
      setCurrentStep('voting')
      
      const metodo = parsedData?.type === 'MANUAL_INPUT' ? 'Ingreso Manual' : 
                     parsedData?.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                     parsedData?.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
                     'QR'
      
      const nombreVotante = parsedData?.persona_info?.nombre_completo || 'Votante'
      toast.success(`Bienvenido ${nombreVotante} (${metodo})`)
      
    } catch (error) {
      console.error('Error procesando identificación:', error)
      toast.error('Error procesando los datos de identificación')
    } finally {
      setTimeout(() => {
        setIsProcessingQR(false)
      }, 1000)
    }
  }

  // ✅ MANTENER RESTO DE FUNCIONES (sin cambios)
  const handleCandidateSelection = (candidateId: number | null) => {
    setSelectedCandidate(candidateId)
  }

  const handleContinueToConfirmation = () => {
    if (selectedCandidate === null && !selectedElection?.permite_voto_blanco) {
      toast.error('Debe seleccionar un candidato')
      return
    }
    setCurrentStep('confirmation')
  }

  const handleProcessVote = async () => {
    try {
      setProcessing(true)
      
      console.log('Iniciando procesamiento de voto...')
      console.log('Datos escaneados:', scannedData)
      console.log('Elección seleccionada:', selectedElection?.id_eleccion)
      console.log('Candidato seleccionado:', selectedCandidate)
      
      const encodeToBase64 = (data: any) => {
        try {
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
          return btoa(unescape(encodeURIComponent(jsonString)))
        } catch (error) {
          console.error('Error en encodeToBase64:', error)
          throw new Error('Error codificando datos a base64')
        }
      }
      
      const decodeFromBase64 = (base64String: string) => {
        try {
          const jsonString = decodeURIComponent(escape(atob(base64String)))
          return JSON.parse(jsonString)
        } catch (error) {
          console.error('Error en decodeFromBase64:', error)
          return null
        }
      }
      
      let qrCodeData: string
      let finalData: any
      
      if (scannedData?.type === 'MANUAL_INPUT' || typeof scannedData === 'string') {
        finalData = {
          numero_documento: scannedData?.doc || scannedData?.numero_documento || scannedData,
          type: 'MANUAL_INPUT',
          timestamp: new Date().toISOString(),
          persona_info: scannedData?.persona_info || {
            nombre_completo: 'Votante',
            documento: scannedData?.doc || scannedData?.numero_documento || scannedData
          }
        }
      } else if (scannedData?.type === 'FICHA_DOCUMENTO_VALIDATION') {
        // ✅ NUEVO: Manejar datos de validación ficha + documento
        finalData = {
          numero_documento: scannedData.numero_documento,
          numero_ficha: scannedData.numero_ficha,
          type: 'FICHA_DOCUMENTO_VALIDATION',
          timestamp: new Date().toISOString(),
          persona_info: scannedData.persona_info,
          ficha_info: scannedData.ficha_info
        }
      } else if (scannedData?.type === 'ACCESUM_SENA_LEARNER') {
        finalData = {
          numero_documento: scannedData.doc || scannedData.numero_documento,
          type: 'ACCESUM_SENA_LEARNER',
          timestamp: new Date().toISOString(),
          persona_info: scannedData.persona_info || {
            nombre_completo: scannedData.nombre || 'Estudiante SENA',
            documento: scannedData.doc || scannedData.numero_documento
          },
          ...scannedData
        }
      } else if (typeof scannedData === 'object' && scannedData !== null) {
        finalData = {
          ...scannedData,
          numero_documento: scannedData.numero_documento || scannedData.doc,
          timestamp: scannedData.timestamp || new Date().toISOString()
        }
      } else {
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
      }
      
      if (!finalData.numero_documento) {
        console.error('No se encontró número de documento en los datos')
        toast.error('No se pudo obtener el número de documento del votante')
        return
      }
      
      qrCodeData = encodeToBase64(finalData)
      console.log('QR Code final (base64):', qrCodeData)
      
      const testDecode = decodeFromBase64(qrCodeData)
      console.log('Test de decodificación:', testDecode)
      
      if (!testDecode?.numero_documento) {
        console.error('Error en la verificación de decodificación')
        toast.error('Error en el formato de los datos de identificación')
        return
      }
      
      const voteData = {
        id_eleccion: selectedElection!.id_eleccion,
        id_candidato: selectedCandidate,
        qr_code: qrCodeData
      }
      
      console.log('VoteData final enviado al backend:', voteData)
      
      const result = await votesApi.cast(voteData)
      console.log('Respuesta del backend:', result)
      
      const enhancedResult = {
        ...result,
        votante_info: {
          nombre_completo: finalData.persona_info?.nombre_completo || 'Votante',
          documento: finalData.numero_documento,
          metodo: finalData.type === 'MANUAL_INPUT' ? 'Ingreso Manual' : 
                 finalData.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                 finalData.type === 'FICHA_DOCUMENTO_VALIDATION' ? 'Mesa de Votación' :
                 finalData.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
                 'QR Genérico'
        }
      }
      
      setVoteResult(enhancedResult)
      setCurrentStep('success')
      
      const nombreVotante = finalData.persona_info?.nombre_completo || 'Votante'
      toast.success(`¡Voto registrado exitosamente para ${nombreVotante}!`)
      
      console.log('Voto procesado exitosamente')
      
    } catch (error: unknown) {
      console.error('Error completo registrando voto:', error)
      
      let errorMessage = 'Error inesperado registrando el voto'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else {
        errorMessage = handleApiError(error)
      }
      
      toast.error(`Error registrando voto: ${errorMessage}`)
      
    } finally {
      setProcessing(false)
    }
  }

  const handleRestart = () => {
    setCurrentStep('elections')
    setSelectedElection(null)
    setCandidates([])
    setScannedData(null)
    setValidatedVoter(null) // ✅ NUEVO
    setSelectedCandidate(null)
    setVoteResult(null)
    setIsProcessingQR(false)
    // Limpiar estados de validación ficha
    setFichaValidationStep('ficha')
    setFichaNumber('')
    setDocumentNumber('')
    setFichaInfo(null)
    setValidationError('')
  }

  const getCandidatePhotoUrl = (candidate: Candidate) => {
    if (candidate.persona?.foto_url) {
      let finalUrl: string
      
      if (candidate.persona.foto_url.startsWith('http')) {
        finalUrl = candidate.persona.foto_url
      } else {
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
          {/* Header con progreso actualizado */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Mesa de Votación</h1>
              <div className="text-sm text-gray-500">
                {selectedElection && `Elección: ${selectedElection.titulo}`}
              </div>
            </div>

            {/* ✅ ACTUALIZAR INDICADOR DE PROGRESO */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              {['elections', 'identification-method', 'ficha-validation', 'voting', 'confirmation', 'success'].map((step, index) => (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    currentStep === step 
                      ? 'bg-sena-500 text-white' 
                      : index < ['elections', 'identification-method', 'ficha-validation', 'voting', 'confirmation', 'success'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 5 && (
                    <div className={`w-8 h-1 mx-1 ${
                      index < ['elections', 'identification-method', 'ficha-validation', 'voting', 'confirmation', 'success'].indexOf(currentStep)
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

              {/* ✅ PASO 1: Selección de elección (mantener igual) */}
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
                    <p className="text-gray-600">Escoge la elección de Representante de Centro en la que deseas votar</p>
                  </div>

                  {activeElections.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-yellow-800 mb-2">No hay elecciones de Representante de Centro activas</h3>
                      <p className="text-yellow-700">No hay elecciones de Representante de Centro disponibles en este momento.</p>
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
                                <span className="bg-sena-100 text-sena-800 px-2 py-1 rounded-full mr-2">
                                  {election.jornada}
                                </span>
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

              {/* ✅ NUEVO PASO: Selección de método de identificación */}
              {currentStep === 'identification-method' && (
                <motion.div
                  key="identification-method"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <IdentificationIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Método de Identificación</h2>
                    <p className="text-gray-600">
                      Selecciona cómo deseas identificar al votante
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Opción QR */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => handleIdentificationMethodSelect('qr')}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IdentificationIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Código QR</h3>
                        <p className="text-gray-600 text-sm">
                          Escanear código QR del carné o dispositivo del votante
                        </p>
                        <div className="mt-4 text-blue-600 text-sm">
                          • Identificación rápida<br />
                          • Compatible con QR SENA<br />
                          • Ingreso manual disponible
                        </div>
                      </div>
                    </motion.div>

                    {/* Opción Ficha + Documento */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white border-2 border-sena-200 rounded-xl p-6 cursor-pointer hover:border-sena-400 transition-colors"
                      onClick={() => handleIdentificationMethodSelect('ficha-documento')}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-sena-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AcademicCapIcon className="w-8 h-8 text-sena-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ficha + Documento</h3>
                        <p className="text-gray-600 text-sm">
                          Validar número de ficha y documento del votante
                        </p>
                        <div className="mt-4 text-sena-600 text-sm">
                          • Validación por ficha<br />
                          • Control anti-fraude<br />
                          • Para Representante de Centro
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('elections')}
                    >
                      Volver
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ✅ PASO 2b: Validación Ficha + Documento (NUEVO) */}
              {currentStep === 'ficha-validation' && (
                <motion.div
                  key="ficha-validation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {fichaValidationStep === 'ficha' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <AcademicCapIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 1: Validar Ficha</h2>
                        <p className="text-gray-600">Ingrese el número de ficha del votante</p>
                      </div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Ficha
                          </label>
                          <input
                            type="text"
                            value={fichaNumber}
                            onChange={(e) => {
                              setFichaNumber(e.target.value)
                              setValidationError('')
                            }}
                            placeholder="Ej: 2465891"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
                            autoFocus
                            disabled={validationLoading}
                          />
                        </div>

                        {validationError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{validationError}</p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep('identification-method')}
                            className="flex-1"
                          >
                            Volver
                          </Button>
                          <Button
                            onClick={validateFicha}
                            disabled={!fichaNumber.trim() || validationLoading}
                            className="flex-1"
                            loading={validationLoading}
                          >
                            Validar Ficha
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {fichaValidationStep === 'documento' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <IdentificationIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 2: Validar Documento</h2>
                        <p className="text-gray-600 mb-4">Ingrese el número de documento del votante</p>
                        
                        {fichaInfo && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-center text-green-800">
                              <CheckCircleIcon className="w-5 h-5 mr-2" />
                              <span className="text-sm font-medium">
                                Ficha {fichaInfo.numero_ficha} - {fichaInfo.nombre_programa}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Documento
                          </label>
                          <input
                            type="text"
                            value={documentNumber}
                            onChange={(e) => {
                              setDocumentNumber(e.target.value)
                              setValidationError('')
                            }}
                            placeholder="Ej: 12345678"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            disabled={validationLoading}
                          />
                        </div>

                        {validationError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{validationError}</p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => setFichaValidationStep('ficha')}
                            className="flex-1"
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={validateDocument}
                            disabled={!documentNumber.trim() || validationLoading}
                            className="flex-1"
                            loading={validationLoading}
                          >
                            Validar Documento
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {fichaValidationStep === 'confirmed' && validatedVoter && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <UserIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Votante Validado</h2>
                        <p className="text-gray-600">Confirme los datos y proceda a votar</p>
                      </div>

                      <div className="max-w-md mx-auto">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-green-900">
                              {validatedVoter.nombres} {validatedVoter.apellidos}
                            </p>
                            <p className="text-green-700">
                              Documento: {validatedVoter.numero_documento}
                            </p>
                          </div>
                          
                          <div className="border-t border-green-200 pt-3">
                            <p className="text-sm text-green-800">
                              <strong>Ficha:</strong> {validatedVoter.ficha_info.numero_ficha}
                            </p>
                            <p className="text-sm text-green-800">
                              <strong>Programa:</strong> {validatedVoter.ficha_info.nombre_programa}
                            </p>
                            <p className="text-sm text-green-800">
                              <strong>Jornada:</strong> {validatedVoter.ficha_info.jornada}
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setFichaValidationStep('documento')}
                            className="flex-1"
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={proceedToVoteFromFicha}
                            className="flex-1"
                          >
                            Proceder a Votar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ✅ PASO 2a: Escaneo QR (mantener existente) */}
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
                    onClose={() => setCurrentStep('identification-method')}
                  />
                </motion.div>
              )}

              {/* ✅ PASO 3: Votación (mantener igual pero actualizar información del votante) */}
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

                  {/* ✅ INFORMACIÓN DEL VOTANTE ACTUALIZADA */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">Votante identificado</p>
                        <div className="space-y-1">
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
                                 scannedData.type === 'FICHA_DOCUMENTO_VALIDATION' ? 'Mesa de Votación' :
                                 scannedData.type === 'DIRECT_INPUT' ? 'Entrada Directa' :
                                 'QR'}
                              </span>
                            )}
                          </p>
                          {/* ✅ MOSTRAR INFO DE FICHA SI ESTÁ DISPONIBLE */}
                          {scannedData?.ficha_info && (
                            <div className="text-green-600 text-xs border-t border-green-200 pt-2 mt-2">
                              <p><strong>Ficha:</strong> {scannedData.ficha_info.numero_ficha}</p>
                              <p><strong>Programa:</strong> {scannedData.ficha_info.nombre_programa}</p>
                              <p><strong>Jornada:</strong> {scannedData.ficha_info.jornada}</p>
                            </div>
                          )}
                          {scannedData?.persona_info?.email && (
                            <p className="text-green-600 text-xs">
                              Email: {scannedData.persona_info.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ LISTA DE CANDIDATOS (mantener igual) */}
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
                                    console.log('Error cargando imagen:', photoUrl)
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

                    {/* Voto en blanco */}
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
                      onClick={() => setCurrentStep(scannedData?.type === 'FICHA_DOCUMENTO_VALIDATION' ? 'ficha-validation' : 'qr-scan')}
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

              {/* ✅ PASO 4: Confirmación (mantener igual) */}
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
                    voterData={scannedData}
                    onConfirm={handleProcessVote}
                    onCancel={() => setCurrentStep('voting')}
                    isProcessing={processing}
                  />
                </motion.div>
              )}

              {/* ✅ PASO 5: Éxito (mantener igual) */}
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