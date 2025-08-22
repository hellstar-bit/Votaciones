//📁 frontend/src/components/aprendices/CreateEditAprendizModal.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { personasApi, fichasApi, type Aprendiz, type Ficha } from '../../services/api';

interface CreateEditAprendizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAprendizSaved: () => void;
  aprendizToEdit?: Aprendiz | null; // null = crear, Aprendiz = editar
}

interface AprendizForm {
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  numero_ficha: string;
}

interface FormErrors {
  nombres?: string;
  apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  numero_ficha?: string;
}

const CreateEditAprendizModal: React.FC<CreateEditAprendizModalProps> = ({
  isOpen,
  onClose,
  onAprendizSaved,
  aprendizToEdit
}) => {
  const [formData, setFormData] = useState<AprendizForm>({
    nombres: '',
    apellidos: '',
    tipo_documento: 'CC',
    numero_documento: '',
    telefono: '',
    email: '',
    numero_ficha: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [loadingFichas, setLoadingFichas] = useState(false);

  const isEditMode = !!aprendizToEdit;

  // Tipos de documento disponibles
  const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'PE', label: 'Permiso Especial' }
  ];

  // Cargar fichas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadFichas();
      if (isEditMode && aprendizToEdit) {
        loadEditData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, aprendizToEdit]);

  // Buscar ficha cuando cambia el número
  useEffect(() => {
    if (formData.numero_ficha.trim()) {
      const ficha = fichas.find(f => f.numero_ficha === formData.numero_ficha.trim());
      setSelectedFicha(ficha || null);
      
      if (!ficha && formData.numero_ficha.trim()) {
        setErrors(prev => ({
          ...prev,
          numero_ficha: 'La ficha ingresada no existe'
        }));
      } else {
        setErrors(prev => {
          const { numero_ficha, ...rest } = prev;
          return rest;
        });
      }
    } else {
      setSelectedFicha(null);
    }
  }, [formData.numero_ficha, fichas]);

  const loadFichas = async () => {
    try {
      setLoadingFichas(true);
      const fichasData = await fichasApi.getAll();
      setFichas(fichasData);
    } catch (error) {
      console.error('Error cargando fichas:', error);
      toast.error('Error cargando las fichas disponibles');
    } finally {
      setLoadingFichas(false);
    }
  };

  const loadEditData = () => {
    if (aprendizToEdit) {
      setFormData({
        nombres: aprendizToEdit.nombres || '',
        apellidos: aprendizToEdit.apellidos || '',
        tipo_documento: aprendizToEdit.tipo_documento || 'CC',
        numero_documento: aprendizToEdit.numero_documento || '',
        telefono: aprendizToEdit.telefono || '',
        email: aprendizToEdit.email || '',
        numero_ficha: aprendizToEdit.ficha?.numero_ficha || ''
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      telefono: '',
      email: '',
      numero_ficha: ''
    });
    setErrors({});
    setSelectedFicha(null);
  };

  const handleInputChange = (field: keyof AprendizForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validación de nombres
    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son obligatorios';
    } else if (formData.nombres.trim().length < 2) {
      newErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
    }

    // Validación de apellidos
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son obligatorios';
    } else if (formData.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    }

    // Validación de número de documento
    if (!formData.numero_documento.trim()) {
      newErrors.numero_documento = 'El número de documento es obligatorio';
    } else if (!/^\d{6,15}$/.test(formData.numero_documento.trim())) {
      newErrors.numero_documento = 'El número de documento debe tener entre 6 y 15 dígitos';
    }

    // Validación de teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'El teléfono debe tener exactamente 10 dígitos';
    }

    // Validación de email
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    }

    // Validación de ficha
    if (!formData.numero_ficha.trim()) {
      newErrors.numero_ficha = 'El número de ficha es obligatorio';
    } else if (!selectedFicha) {
      newErrors.numero_ficha = 'La ficha ingresada no existe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim().toLowerCase(),
        id_ficha: selectedFicha?.id_ficha
      };

      if (isEditMode && aprendizToEdit) {
        // Actualizar aprendiz existente
        await personasApi.updateAprendiz(aprendizToEdit.id_persona, submitData);
        toast.success('Aprendiz actualizado exitosamente');
      } else {
        // Crear nuevo aprendiz
        await personasApi.createAprendiz(submitData);
        toast.success('Aprendiz creado exitosamente');
      }

      onAprendizSaved();
      handleClose();
    } catch (error: any) {
      console.error('Error al guardar aprendiz:', error);
      
      if (error.response?.status === 409) {
        toast.error('Ya existe un aprendiz con este número de documento');
      } else if (error.response?.status === 400) {
        toast.error('Datos inválidos. Verifica la información ingresada');
      } else {
        toast.error(isEditMode ? 'Error al actualizar el aprendiz' : 'Error al crear el aprendiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-sena-600 to-sena-700 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {isEditMode ? 'Editar Aprendiz' : 'Crear Nuevo Aprendiz'}
                  </h3>
                  <p className="text-sm text-sena-100">
                    {isEditMode 
                      ? 'Actualiza la información del aprendiz'
                      : 'Completa los datos para registrar un nuevo aprendiz'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Información Personal */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombres */}
                  <div>
                    <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      id="nombres"
                      value={formData.nombres}
                      onChange={(e) => handleInputChange('nombres', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.nombres ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa los nombres"
                      disabled={loading}
                    />
                    {errors.nombres && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.apellidos ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa los apellidos"
                      disabled={loading}
                    />
                    {errors.apellidos && (
                      <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documento de Identidad */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <IdentificationIcon className="w-4 h-4 text-gray-400 mr-2" />
                  Documento de Identidad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tipo de documento */}
                  <div>
                    <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      id="tipo_documento"
                      value={formData.tipo_documento}
                      onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.tipo_documento ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      {tiposDocumento.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipo_documento && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipo_documento}</p>
                    )}
                  </div>

                  {/* Número de documento */}
                  <div className="md:col-span-2">
                    <label htmlFor="numero_documento" className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      id="numero_documento"
                      value={formData.numero_documento}
                      onChange={(e) => handleInputChange('numero_documento', e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.numero_documento ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa el número de documento"
                      disabled={loading || isEditMode} // No permitir editar documento en modo edición
                    />
                    {errors.numero_documento && (
                      <p className="mt-1 text-sm text-red-600">{errors.numero_documento}</p>
                    )}
                    {isEditMode && (
                      <p className="mt-1 text-xs text-gray-500">
                        El número de documento no se puede modificar
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                  Información de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.telefono ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa el teléfono"
                      disabled={loading}
                    />
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="correo@ejemplo.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Académica */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <AcademicCapIcon className="w-4 h-4 text-gray-400 mr-2" />
                  Información Académica
                </h4>
                
                {/* Número de Ficha */}
                <div>
                  <label htmlFor="numero_ficha" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Ficha *
                  </label>
                  <input
                    type="text"
                    id="numero_ficha"
                    value={formData.numero_ficha}
                    onChange={(e) => handleInputChange('numero_ficha', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sena-500 focus:border-sena-500 ${
                      errors.numero_ficha ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ingresa el número de ficha"
                    disabled={loading || loadingFichas}
                  />
                  {errors.numero_ficha && (
                    <p className="mt-1 text-sm text-red-600">{errors.numero_ficha}</p>
                  )}
                  
                  {/* Información de la ficha seleccionada */}
                  {selectedFicha && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Ficha encontrada: {selectedFicha.numero_ficha}
                          </p>
                          <p className="text-sm text-green-700">
                            {selectedFicha.nombre_programa}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-green-600">
                              Jornada: {selectedFicha.jornada}
                            </span>
                            {selectedFicha.sede && (
                              <span className="text-xs text-green-600">
                                Sede: {selectedFicha.sede.nombre_sede}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no se encuentra la ficha */}
                  {formData.numero_ficha.trim() && !selectedFicha && !loadingFichas && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Ficha no encontrada
                          </p>
                          <p className="text-sm text-yellow-700">
                            Verifica que el número de ficha sea correcto
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingFichas}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sena-600 hover:bg-sena-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Actualizar Aprendiz' : 'Crear Aprendiz'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEditAprendizModal;