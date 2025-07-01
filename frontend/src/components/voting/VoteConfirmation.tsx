// VoteConfirmation.tsx - Componente para confirmar el voto
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import type { Election, Candidate } from '../../services/api'

interface VoteConfirmationProps {
  election: Election
  candidate: Candidate | null
  voterData: any
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

const VoteConfirmation = ({
  election,
  candidate,
  voterData,
  onConfirm,
  onCancel,
  isProcessing
}: VoteConfirmationProps) => {
  const isBlankVote = candidate === null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Voto</h2>
        <p className="text-gray-600">Revisa cuidadosamente tu selección antes de confirmar</p>
      </div>

      {/* Advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">¡Atención!</h3>
            <p className="text-yellow-700 text-sm">
              Una vez confirmado, tu voto no podrá ser modificado. 
              Asegúrate de que la información sea correcta.
            </p>
          </div>
        </div>
      </div>

      {/* Resumen del voto */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200">
        {/* Información de la elección */}
        <div className="p-6">
          <div className="flex items-start">
            <ClipboardDocumentListIcon className="w-6 h-6 text-sena-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Elección</h3>
              <p className="text-gray-800 mb-2">{election.titulo}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>🗳️ {election.tipoEleccion.nombre_tipo}</span>
                <span>📅 {new Date(election.fecha_inicio).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del votante */}
        <div className="p-6">
          <div className="flex items-start">
            <UserIcon className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Votante</h3>
              <p className="text-gray-800 mb-2">
                Documento: {voterData?.doc || voterData?.numero_documento}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Método de identificación:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  voterData?.type === 'ACCESUM_SENA_LEARNER' 
                    ? 'bg-green-100 text-green-800' 
                    : voterData?.type === 'MANUAL_INPUT'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {voterData?.type === 'ACCESUM_SENA_LEARNER' ? 'QR SENA' : 
                   voterData?.type === 'MANUAL_INPUT' ? 'Manual' : 'QR Genérico'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selección de voto */}
        <div className="p-6">
          <div className="flex items-start">
            {isBlankVote ? (
              <XCircleIcon className="w-6 h-6 text-gray-500 mr-3 mt-1" />
            ) : (
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 mt-1" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Tu Voto</h3>
              {isBlankVote ? (
                <div>
                  <p className="text-gray-800 mb-2 font-medium">Voto en Blanco</p>
                  <p className="text-sm text-gray-600">
                    Has elegido no votar por ningún candidato
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-800 mb-2 font-medium">
                    {candidate?.persona.nombreCompleto}
                  </p>
                  <p className="text-sm text-gray-600">
                    Lista #{candidate?.numero_lista}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmación final */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="text-center">
          <h3 className="font-semibold text-red-800 mb-2">Confirmación final</h3>
          <p className="text-red-700 text-sm mb-3">
            ¿Estás seguro de que deseas emitir tu voto con la información mostrada arriba?
          </p>
          <p className="text-red-800 text-xs font-medium">
            Esta acción no se puede deshacer
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isProcessing}
          className="flex-1"
        >
          Cancelar y Revisar
        </Button>
        
        <Button
          onClick={onConfirm}
          loading={isProcessing}
          disabled={isProcessing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? 'Registrando Voto...' : 'Confirmar y Votar'}
        </Button>
      </div>

      {/* Mensaje de procesamiento */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800 font-medium">Procesando tu voto...</span>
          </div>
          <p className="text-blue-700 text-sm text-center mt-2">
            Por favor espera mientras registramos tu voto de forma segura
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default VoteConfirmation