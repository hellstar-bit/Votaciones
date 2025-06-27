// VoteConfirmation.tsx
import { motion } from 'framer-motion'
import { 
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import { type Election, type Candidate } from '../../services/api'

interface VoteConfirmationProps {
  election: Election | null
  candidate: Candidate | undefined
  isBlankVote: boolean
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}

const VoteConfirmation = ({ 
  election, 
  candidate, 
  isBlankVote, 
  onConfirm, 
  onCancel, 
  processing 
}: VoteConfirmationProps) => {
  return (
    <motion.div
      key="confirmation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center">
        <ShieldCheckIcon className="w-16 h-16 text-sena-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Voto</h2>
        <p className="text-gray-600">Revisa tu selección antes de confirmar</p>
      </div>

      {/* Información de la elección */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-gray-600" />
          Información de la Elección
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Elección:</span>
            <p className="font-medium text-gray-900">{election?.titulo}</p>
          </div>
          <div>
            <span className="text-gray-500">Tipo:</span>
            <p className="font-medium text-gray-900">{election?.tipoEleccion?.nombre_tipo}</p>
          </div>
          <div>
            <span className="text-gray-500">Finaliza:</span>
            <p className="font-medium text-gray-900">
              {election?.fecha_fin ? new Date(election.fecha_fin).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Estado:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Activa
            </span>
          </div>
        </div>
      </div>

      {/* Selección del candidato */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-gray-600" />
          Tu Selección
        </h3>

        {isBlankVote ? (
          <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Voto en Blanco</h4>
              <p className="text-sm text-gray-600">No apoyas a ningún candidato en esta elección</p>
            </div>
          </div>
        ) : candidate ? (
          <div className="flex items-center space-x-4 p-4 bg-sena-50 rounded-lg border border-sena-200">
            <div className="w-12 h-12 bg-sena-100 rounded-full flex items-center justify-center">
              <span className="text-sena-600 font-semibold text-lg">
                {candidate.persona.nombres.charAt(0)}{candidate.persona.apellidos.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{candidate.persona.nombreCompleto}</h4>
              <p className="text-sm text-gray-600">Documento: {candidate.persona.numero_documento}</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No se ha seleccionado ningún candidato
          </div>
        )}
      </div>

      {/* Advertencias importantes */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-800 mb-2">Información Importante</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Tu voto es <strong>secreto y anónimo</strong></li>
              <li>• Una vez confirmado, <strong>no podrás cambiarlo</strong></li>
              <li>• Solo puedes votar <strong>una vez</strong> en esta elección</li>
              <li>• Se generará un hash de verificación para tu comprobante</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-3"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={onConfirm}
          loading={processing}
          disabled={processing}
          className="flex-1 py-3 bg-sena-600 hover:bg-sena-700"
        >
          {processing ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Procesando...
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Confirmar Voto
            </div>
          )}
        </Button>
      </div>

      {/* Indicador de procesamiento */}
      {processing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-sena-500 border-t-transparent rounded-full animate-spin" />
            <span>Registrando tu voto de forma segura...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default VoteConfirmation