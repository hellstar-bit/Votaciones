// 📁 frontend/src/components/voting/VotingBoothValidation.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  IdentificationIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface VotingBoothValidationProps {
  electionId: number;
  onValidationSuccess: (voterData: ValidatedVoter) => void;
  onBack: () => void;
}

interface ValidatedVoter {
  numero_documento: string;
  numero_ficha: string;
  nombres: string;
  apellidos: string;
  id_persona: number;
  ficha_info: {
    numero_ficha: string;
    nombre_programa: string;
    jornada: string;
  };
}

const VotingBoothValidation: React.FC<VotingBoothValidationProps> = ({
  electionId,
  onValidationSuccess,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState<'ficha' | 'documento' | 'confirm'>('ficha');
  const [fichaNumber, setFichaNumber] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fichaInfo, setFichaInfo] = useState<any>(null);
  const [voterData, setVoterData] = useState<ValidatedVoter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ PASO 1: Validar Ficha (usando misma lógica que gestión de aprendices)
  const validateFicha = async () => {
    if (!fichaNumber.trim()) {
      setError('Ingrese un número de ficha válido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/v1/fichas/validate/${fichaNumber.trim()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.ficha) {
          setFichaInfo(data.ficha);
          setCurrentStep('documento');
          toast.success(`✅ Ficha ${fichaNumber} encontrada`);
        } else {
          setError(`La ficha ${fichaNumber} no existe en el sistema`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error validando la ficha');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ PASO 2: Validar Documento en la Ficha
  const validateDocument = async () => {
    if (!documentNumber.trim()) {
      setError('Ingrese un número de documento válido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/v1/personas/validate-in-ficha`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero_ficha: fichaNumber.trim(),
          numero_documento: documentNumber.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.persona) {
          // ✅ VALIDAR QUE NO HAYA VOTADO YA
          const hasVotedResponse = await fetch(`/api/v1/elections/${electionId}/has-voted`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              numero_documento: documentNumber.trim()
            })
          });

          const hasVotedData = await hasVotedResponse.json();
          
          if (hasVotedData.hasVoted) {
            setError(`⚠️ Esta persona ya votó en esta elección el ${new Date(hasVotedData.fechaVoto).toLocaleString()}`);
            return;
          }

          // ✅ TODO OK - PREPARAR DATOS PARA VOTAR
          const validatedVoter: ValidatedVoter = {
            numero_documento: data.persona.numero_documento,
            numero_ficha: fichaNumber.trim(),
            nombres: data.persona.nombres,
            apellidos: data.persona.apellidos,
            id_persona: data.persona.id_persona,
            ficha_info: {
              numero_ficha: fichaInfo.numero_ficha,
              nombre_programa: fichaInfo.nombre_programa,
              jornada: fichaInfo.jornada
            }
          };

          setVoterData(validatedVoter);
          setCurrentStep('confirm');
          toast.success('✅ Votante validado correctamente');
        } else {
          setError(`El documento ${documentNumber} no existe en la ficha ${fichaNumber}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error validando el documento');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CONFIRMAR Y PROCEDER A VOTAR
  const proceedToVote = () => {
    if (voterData) {
      onValidationSuccess(voterData);
    }
  };

  // ✅ RENDERIZAR PASOS
  const renderStep = () => {
    switch (currentStep) {
      case 'ficha':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <AcademicCapIcon className="w-16 h-16 text-sena-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Paso 1: Validar Ficha
              </h3>
              <p className="text-gray-600">
                Ingrese el número de ficha del votante
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Ficha
                </label>
                <input
                  type="text"
                  value={fichaNumber}
                  onChange={(e) => {
                    setFichaNumber(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: 2465891"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={validateFicha}
                disabled={!fichaNumber.trim() || loading}
                className="w-full bg-sena-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sena-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ArrowRightIcon className="w-5 h-5 mr-2" />
                )}
                Validar Ficha
              </button>
            </div>
          </motion.div>
        );

      case 'documento':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <IdentificationIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Paso 2: Validar Documento
              </h3>
              <p className="text-gray-600 mb-4">
                Ingrese el número de documento del votante
              </p>
              
              {/* Info de ficha validada */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center text-green-800">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    Ficha {fichaInfo?.numero_ficha} - {fichaInfo?.nombre_programa}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => {
                    setDocumentNumber(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep('ficha')}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 flex items-center justify-center"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Atrás
                </button>
                <button
                  onClick={validateDocument}
                  disabled={!documentNumber.trim() || loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <ArrowRightIcon className="w-5 h-5 mr-2" />
                  )}
                  Validar Documento
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'confirm':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <UserIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Votante Validado
              </h3>
              <p className="text-gray-600">
                Confirme los datos y proceda a votar
              </p>
            </div>

            {voterData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-900">
                    {voterData.nombres} {voterData.apellidos}
                  </p>
                  <p className="text-green-700">
                    Documento: {voterData.numero_documento}
                  </p>
                </div>
                
                <div className="border-t border-green-200 pt-3">
                  <p className="text-sm text-green-800">
                    <strong>Ficha:</strong> {voterData.ficha_info.numero_ficha}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Programa:</strong> {voterData.ficha_info.nombre_programa}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Jornada:</strong> {voterData.ficha_info.jornada}
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentStep('documento')}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 flex items-center justify-center"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Atrás
              </button>
              <button
                onClick={proceedToVote}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Proceder a Votar
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Mesa de Votación
          </h2>
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-6">
          {['ficha', 'documento', 'confirm'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step 
                  ? 'bg-sena-600 text-white' 
                  : index < ['ficha', 'documento', 'confirm'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  index < ['ficha', 'documento', 'confirm'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VotingBoothValidation;