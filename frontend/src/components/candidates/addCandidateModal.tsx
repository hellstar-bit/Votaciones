// AddCandidateModal.tsx - Versión corregida completa
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  HashtagIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { candidatesApi, personasApi, fichasApi } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AddCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  electionId: number
  onCandidateAdded: () => void
}

interface Aprendiz {
  id_persona: number
  numero_documento: string
  tipo_documento: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  email: string
  telefono: string
  jornada?: string
  ficha?: {
    id_ficha: number
    numero_ficha: string
    nombre_programa: string
    jornada: string
  }
  sede?: {
    id_sede: number
    nombre_sede: string
  }
  centro?: {
    id_centro: number
    nombre_centro: string
  }
}

interface Ficha {
  id_ficha: number
  numero_ficha: string
  nombre_programa: string
  jornada: string
  fecha_inicio?: string
  fecha_fin?: string
  sede?: {
    id_sede: number
    nombre_sede: string
  }
  centro?: {
    id_centro: number
    nombre_centro: string
  }
}

interface ManualCandidateForm {
  numero_documento: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  foto?: File | null
}

const AddCandidateModal = ({ isOpen, onClose, electionId, onCandidateAdded }: AddCandidateModalProps) => {
  // Estados principales
  const [step, setStep] = useState<'method' | 'search' | 'manual' | 'confirm'>('method')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)

  // Estados para búsqueda de aprendices
  const [aprendices, setAprendices] = useState<Aprendiz[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFicha, setSelectedFicha] = useState<string>('all')
  const [selectedAprendiz, setSelectedAprendiz] = useState<Aprendiz | null>(null)

  // Estados para formulario manual
  const [manualForm, setManualForm] = useState<ManualCandidateForm>({
    numero_documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    foto: null
  })

  // Estados para foto
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [, setUploadingPhoto] = useState(false)

  // Estado para número de lista
  const [numeroLista, setNumeroLista] = useState('')

  useEffect(() => {
  if (isOpen) {
    console.log('🎯 Modal abierto para elección:', electionId);
    console.log('🔧 URL de API configurada:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1');
    
    // Verificar autenticación
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        console.log('🔑 Auth storage encontrado:', {
          hasState: !!parsed.state,
          hasUser: !!parsed.state?.user,
          hasToken: !!parsed.state?.user?.access_token
        });
      } catch (e) {
        console.error('❌ Error parsing auth storage:', e);
      }
    } else {
      console.warn('⚠️ No hay auth storage');
    }
  }
}, [isOpen, electionId]);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadAprendices()
      loadFichas()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep('method')
    setIsManualMode(false)
    setSearchTerm('')
    setSelectedFicha('all')
    setSelectedAprendiz(null)
    setManualForm({
      numero_documento: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      foto: null
    })
    setNumeroLista('')
    setPhotoPreview(null)
    setUploadingPhoto(false)
  }

  const loadAprendices = async () => {
    try {
      setLoading(true)
      const data = await personasApi.getAprendices()
      setAprendices(data)
    } catch (error) {
      console.error('Error cargando aprendices:', error)
      // Datos simulados para desarrollo
      setAprendices([
        {
          id_persona: 1,
          numero_documento: '1234567890',
          nombres: 'Juan Carlos',
          apellidos: 'González Pérez',
          nombreCompleto: 'Juan Carlos González Pérez',
          email: 'juan.gonzalez@ejemplo.com',
          telefono: '3001234567',
          tipo_documento: 'CC',
          ficha: {
            id_ficha: 1,
            numero_ficha: '3037398',
            nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
            jornada: 'mixta'
          }
        },
        {
          id_persona: 2,
          numero_documento: '0987654321',
          nombres: 'María José',
          apellidos: 'Rodríguez López',
          nombreCompleto: 'María José Rodríguez López',
          email: 'maria.rodriguez@ejemplo.com',
          telefono: '3007654321',
          tipo_documento: 'CC',
          ficha: {
            id_ficha: 2,
            numero_ficha: '3037399',
            nombre_programa: 'OPERACIONES COMERCIALES',
            jornada: 'nocturna'
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadFichas = async () => {
    try {
      const data = await fichasApi.getAll()
      setFichas(data)
    } catch (error) {
      console.error('Error cargando fichas:', error)
      // Datos simulados para desarrollo
      setFichas([
        {
          id_ficha: 1,
          numero_ficha: '3037398',
          nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
          jornada: 'mixta'
        },
        {
          id_ficha: 2,
          numero_ficha: '3037399',
          nombre_programa: 'OPERACIONES COMERCIALES',
          jornada: 'nocturna'
        },
        {
          id_ficha: 3,
          numero_ficha: '3070126',
          nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
          jornada: 'madrugada'
        }
      ])
    }
  }

  // Funciones para manejo de foto
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('📸 === INICIO DE PHOTO UPLOAD ===');
  
  const file = event.target.files?.[0];
  if (!file) {
    console.log('❌ No hay archivo seleccionado');
    return;
  }

  console.log('📁 Archivo seleccionado:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  });

  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    console.error('❌ Tipo de archivo inválido:', file.type);
    toast.error('Solo se permiten archivos de imagen');
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    console.error('❌ Archivo demasiado grande:', file.size);
    toast.error('La imagen no debe superar los 5MB');
    return;
  }

  console.log('✅ Archivo válido, creando preview...');

  // Crear preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    console.log('🖼️ Preview creado exitosamente, tamaño:', result.length);
    setPhotoPreview(result);
  };
  reader.onerror = (e) => {
    console.error('❌ Error leyendo archivo:', e);
    toast.error('Error al procesar la imagen');
  };
  reader.readAsDataURL(file);

  // Guardar archivo en el estado
  setManualForm(prev => {
    const updated = { ...prev, foto: file };
    console.log('💾 Estado actualizado:', {
      ...updated,
      foto: updated.foto ? {
        name: updated.foto.name,
        size: updated.foto.size,
        type: updated.foto.type
      } : null
    });
    return updated;
  });

  console.log('🏁 === FIN DE PHOTO UPLOAD ===');
};

  const removePhoto = () => {
    setManualForm({ ...manualForm, foto: null })
    setPhotoPreview(null)
  }

  // Filtrar aprendices
  const filteredAprendices = aprendices.filter(aprendiz => {
    const matchesSearch = 
      aprendiz.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aprendiz.numero_documento.includes(searchTerm) ||
      aprendiz.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFicha = selectedFicha === 'all' || 
      aprendiz.ficha?.numero_ficha === selectedFicha

    return matchesSearch && matchesFicha
  })

  const validateForm = () => {
    console.log('🔍 Validando formulario...')
    console.log('Step actual:', step)
    console.log('Numero lista:', numeroLista)
    console.log('Selected aprendiz:', selectedAprendiz)
    console.log('Manual form:', manualForm)

    if (!numeroLista.trim()) {
      console.log('❌ Número de lista vacío')
      toast.error('El número de lista es obligatorio')
      return false
    }

    const numeroListaNum = parseInt(numeroLista)
    if (isNaN(numeroListaNum) || numeroListaNum < 1) {
      console.log('❌ Número de lista inválido')
      toast.error('El número de lista debe ser un número válido mayor a 0')
      return false
    }

    // Validación para modo manual (cuando venimos del formulario manual)
    if (step === 'confirm' && !selectedAprendiz) {
      // Verificar si tenemos datos del formulario manual
      if (!manualForm.numero_documento.trim()) {
        console.log('❌ Documento vacío en modo manual')
        toast.error('El número de documento es obligatorio')
        return false
      }
      if (!manualForm.nombres.trim()) {
        console.log('❌ Nombres vacíos en modo manual')
        toast.error('Los nombres son obligatorios')
        return false
      }
      if (!manualForm.apellidos.trim()) {
        console.log('❌ Apellidos vacíos en modo manual')
        toast.error('Los apellidos son obligatorios')
        return false
      }
      if (!manualForm.foto) {
        console.log('❌ Foto faltante en modo manual')
        toast.error('La foto de perfil es obligatoria')
        return false
      }
      if (manualForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email)) {
        console.log('❌ Email inválido en modo manual')
        toast.error('El formato del email no es válido')
        return false
      }
    }

    // Validación para modo búsqueda (cuando venimos de seleccionar aprendiz)
    if (step === 'confirm' && selectedAprendiz) {
      console.log('✅ Aprendiz seleccionado válido')
      // Si hay aprendiz seleccionado, todo está bien
    }

    // Si llegamos hasta aquí sin selectedAprendiz y sin datos manuales, es error
    if (step === 'confirm' && !selectedAprendiz && !manualForm.numero_documento.trim()) {
      console.log('❌ No hay aprendiz seleccionado ni datos manuales')
      toast.error('Debe seleccionar un aprendiz o completar los datos manuales')
      return false
    }

    console.log('✅ Validación exitosa')
    return true
  }

  const handleSubmit = async () => {
  console.log('🚀 === INICIO DE SUBMIT ===');
  console.log('Step actual:', step);
  console.log('Is manual mode:', isManualMode);
  console.log('Selected aprendiz:', selectedAprendiz);
  console.log('Numero lista:', numeroLista);
  console.log('Manual form completo:', {
    numero_documento: manualForm.numero_documento,
    nombres: manualForm.nombres,
    apellidos: manualForm.apellidos,
    email: manualForm.email,
    telefono: manualForm.telefono,
    foto: manualForm.foto ? {
      name: manualForm.foto.name,
      size: manualForm.foto.size,
      type: manualForm.foto.type
    } : null
  });

  if (!validateForm()) {
    console.log('❌ Validación falló');
    return;
  }

  try {
    setSubmitting(true);

    // Si es modo manual, usar FormData
    if (isManualMode || (!selectedAprendiz && manualForm.numero_documento.trim())) {
      console.log('📝 === MODO MANUAL CON FORMDATA ===');
      
      const formData = new FormData();
      formData.append('id_eleccion', electionId.toString());
      formData.append('numero_documento', manualForm.numero_documento.trim());
      formData.append('numero_lista', numeroLista);
      formData.append('nombres', manualForm.nombres.trim());
      formData.append('apellidos', manualForm.apellidos.trim());
      
      if (manualForm.email.trim()) {
        formData.append('email', manualForm.email.trim());
      }
      if (manualForm.telefono.trim()) {
        formData.append('telefono', manualForm.telefono.trim());
      }
      if (manualForm.foto) {
        console.log('📸 Agregando foto al FormData:', {
          name: manualForm.foto.name,
          size: manualForm.foto.size,
          type: manualForm.foto.type
        });
        formData.append('foto', manualForm.foto);
      }

      // Debug completo del FormData
      console.log('📤 === CONTENIDO DEL FORMDATA ===');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Obtener token de autenticación
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          // Probar diferentes estructuras de token
          token = parsed.state?.user?.access_token || 
                  parsed.state?.token || 
                  parsed.access_token || 
                  parsed.token || '';
          console.log('🔑 Token extraído:', token ? `${token.substring(0, 20)}...` : 'NO ENCONTRADO');
        } catch (e) {
          console.error('❌ Error parsing auth storage:', e);
        }
      }

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/candidates`;
      console.log('🌐 URL de envío:', url);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📡 Headers de la petición:', headers);

      // Hacer petición con FormData
      console.log('⏳ Enviando petición...');
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log('📡 Response recibido:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ === RESULTADO EXITOSO ===', result);

    } else if (selectedAprendiz) {
      // Para aprendices existentes, usar JSON normal
      console.log('👤 === MODO APRENDIZ EXISTENTE ===');
      
      const candidateData = {
        id_eleccion: electionId,
        numero_documento: selectedAprendiz.numero_documento,
        numero_lista: parseInt(numeroLista),
        nombres: selectedAprendiz.nombres,
        apellidos: selectedAprendiz.apellidos,
        email: selectedAprendiz.email,
        telefono: selectedAprendiz.telefono
      };

      console.log('📤 Datos del candidato (JSON):', candidateData);
      const result = await candidatesApi.create(candidateData);
      console.log('✅ Candidato creado exitosamente:', result);
    }

    toast.success('¡Candidato agregado exitosamente!');
    onCandidateAdded();
    onClose();

  } catch (error) {
    let errorMessage = 'Error desconocido';
    let errorStack = '';
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof (error as any).message === 'string') {
        errorMessage = (error as any).message;
      }
      if ('stack' in error && typeof (error as any).stack === 'string') {
        errorStack = (error as any).stack;
      }
    }
    console.error('❌ === ERROR COMPLETO ===', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    // Mostrar error más detallado al usuario
    if (typeof errorMessage === 'string' && errorMessage.includes('401')) {
      toast.error('Error de autenticación. Inicia sesión nuevamente.');
    } else if (typeof errorMessage === 'string' && errorMessage.includes('413')) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
    } else if (typeof errorMessage === 'string' && errorMessage.includes('400')) {
      toast.error('Datos inválidos. Revisa el formulario.');
    } else {
      toast.error(`Error: ${errorMessage}`);
    }
  } finally {
    setSubmitting(false);
    console.log('🏁 === FIN DE SUBMIT ===');
  }
};

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getJornadaColor = (jornada: string) => {
    switch (jornada) {
      case 'mixta': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'nocturna': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'madrugada': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderStepMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Agregar Candidato
        </h3>
        <p className="text-sm text-gray-500">
          Seleccione cómo desea agregar el candidato
        </p>
      </div>

      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStep('search')}
          className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-sena-300 hover:bg-sena-50 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-sena-100 rounded-lg flex items-center justify-center group-hover:bg-sena-200">
              <MagnifyingGlassIcon className="w-6 h-6 text-sena-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Buscar Aprendiz Registrado</h4>
              <p className="text-sm text-gray-500">Seleccionar de la base de datos de aprendices</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsManualMode(true)
            setStep('manual')
          }}
          className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-sena-300 hover:bg-sena-50 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-sena-100 rounded-lg flex items-center justify-center group-hover:bg-sena-200">
              <UserPlusIcon className="w-6 h-6 text-sena-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Agregar Manualmente</h4>
              <p className="text-sm text-gray-500">Ingresar datos del candidato manualmente</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  )

  const renderStepSearch = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Buscar Aprendiz
          </h3>
          <p className="text-sm text-gray-500">
            Seleccione un aprendiz de la base de datos
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setStep('method')}
          className="text-gray-500 hover:text-gray-700"
        >
          Volver
        </Button>
      </div>

      {/* Controles de búsqueda */}
      <div className="space-y-4">
        <Input
          placeholder="Buscar por nombre, documento o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<MagnifyingGlassIcon className="w-5 h-5" />}
          fullWidth
        />

        <select
          value={selectedFicha}
          onChange={(e) => setSelectedFicha(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sena-500 focus:border-sena-500"
        >
          <option value="all">Todas las fichas</option>
          {fichas.map(ficha => (
            <option key={ficha.id_ficha} value={ficha.numero_ficha}>
              {ficha.numero_ficha} - {ficha.nombre_programa}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de aprendices */}
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-sena-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Cargando aprendices...</p>
          </div>
        ) : filteredAprendices.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAprendices.map((aprendiz) => (
              <motion.button
                key={aprendiz.id_persona}
                whileHover={{ backgroundColor: '#f9fafb' }}
                onClick={() => {
                  setSelectedAprendiz(aprendiz)
                  setStep('confirm')
                }}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {aprendiz.nombreCompleto}
                      </p>
                      {aprendiz.ficha && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJornadaColor(aprendiz.ficha.jornada)}`}>
                          {aprendiz.ficha.jornada}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {aprendiz.numero_documento} • {aprendiz.email}
                    </p>
                    {aprendiz.ficha && (
                      <p className="text-xs text-gray-400 truncate">
                        Ficha {aprendiz.ficha.numero_ficha} - {aprendiz.ficha.nombre_programa}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">
              {searchTerm || selectedFicha !== 'all' 
                ? 'No se encontraron aprendices con los filtros aplicados'
                : 'No hay aprendices disponibles'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderStepManual = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Datos del Candidato
          </h3>
          <p className="text-sm text-gray-500">
            Ingrese la información del candidato manualmente
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setStep('method')}
          className="text-gray-500 hover:text-gray-700"
        >
          Volver
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          label="Número de Documento *"
          placeholder="Ej: 1234567890"
          value={manualForm.numero_documento}
          onChange={(e) => setManualForm({ ...manualForm, numero_documento: e.target.value })}
          icon={<IdentificationIcon className="w-5 h-5" />}
          fullWidth
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombres *"
            placeholder="Ej: Juan Carlos"
            value={manualForm.nombres}
            onChange={(e) => setManualForm({ ...manualForm, nombres: e.target.value })}
            icon={<UserIcon className="w-5 h-5" />}
            fullWidth
            required
          />

          <Input
            label="Apellidos *"
            placeholder="Ej: González Pérez"
            value={manualForm.apellidos}
            onChange={(e) => setManualForm({ ...manualForm, apellidos: e.target.value })}
            icon={<UserIcon className="w-5 h-5" />}
            fullWidth
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="Ej: juan.gonzalez@ejemplo.com"
          value={manualForm.email}
          onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
          icon={<EnvelopeIcon className="w-5 h-5" />}
          fullWidth
        />

        <Input
          label="Teléfono"
          placeholder="Ej: 3001234567"
          value={manualForm.telefono}
          onChange={(e) => setManualForm({ ...manualForm, telefono: e.target.value })}
          icon={<PhoneIcon className="w-5 h-5" />}
          fullWidth
        />

        {/* Sección de foto de perfil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Foto de Perfil *
          </label>
          
          <div className="flex items-start space-x-4">
            {/* Preview de la foto */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                  <CameraIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Botón de upload */}
            <div className="flex-1">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sena-500 transition-colors"
              >
                <PhotoIcon className="w-4 h-4 mr-2" />
                {photoPreview ? 'Cambiar Foto' : 'Subir Foto'}
              </label>
              
              <p className="text-xs text-gray-500 mt-2">
                Formatos: JPG, PNG, GIF. Máximo 5MB.
                <br />
                Recomendado: 400x400px o superior.
              </p>

              {manualForm.foto && (
                <div className="mt-2 text-xs text-green-600 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Foto cargada: {manualForm.foto.name}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Información</h4>
              <p className="text-xs text-blue-700 mt-1">
                Los campos marcados con * son obligatorios. La foto de perfil es requerida para la papeleta de votación.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={() => {
            if (manualForm.numero_documento.trim() && manualForm.nombres.trim() && manualForm.apellidos.trim() && manualForm.foto) {
              console.log('✅ Datos manuales completos incluyendo foto, yendo a confirm')
              setStep('confirm')
            } else {
              console.log('❌ Datos manuales incompletos')
              if (!manualForm.foto) {
                toast.error('La foto de perfil es obligatoria')
              } else {
                toast.error('Complete todos los campos obligatorios')
              }
            }
          }}
          disabled={!manualForm.numero_documento.trim() || !manualForm.nombres.trim() || !manualForm.apellidos.trim() || !manualForm.foto}
          className="w-full bg-sena-600 hover:bg-sena-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderStepConfirm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Confirmar Candidato
          </h3>
          <p className="text-sm text-gray-500">
            Revise los datos y asigne un número de lista
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setStep(isManualMode ? 'manual' : 'search')}
          className="text-gray-500 hover:text-gray-700"
        >
          Volver
        </Button>
      </div>

      {/* Información del candidato */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-4">
          {/* Mostrar foto si está disponible */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-sena-100 flex items-center justify-center flex-shrink-0">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Foto del candidato"
                className="w-full h-full object-cover"
              />
            ) : selectedAprendiz ? (
              <UserIcon className="w-8 h-8 text-sena-600" />
            ) : (
              <UserIcon className="w-8 h-8 text-sena-600" />
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {selectedAprendiz?.nombreCompleto || `${manualForm.nombres} ${manualForm.apellidos}`}
            </p>
            <p className="text-sm text-gray-500">
              {selectedAprendiz?.numero_documento || manualForm.numero_documento}
            </p>
            {(photoPreview || selectedAprendiz) && (
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                {photoPreview ? 'Foto subida' : 'Datos de aprendiz'}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex items-center text-sm">
            <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">
              {selectedAprendiz?.email || manualForm.email || 'No especificado'}
            </span>
          </div>

          {(selectedAprendiz?.telefono || manualForm.telefono) && (
            <div className="flex items-center text-sm">
              <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">
                {selectedAprendiz?.telefono || manualForm.telefono}
              </span>
            </div>
          )}

          {selectedAprendiz?.ficha && (
            <div className="flex items-center text-sm">
              <AcademicCapIcon className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">
                Ficha {selectedAprendiz.ficha.numero_ficha} - {selectedAprendiz.ficha.nombre_programa}
              </span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJornadaColor(selectedAprendiz.ficha.jornada)}`}>
                {selectedAprendiz.ficha.jornada}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Número de lista */}
      <div>
        <Input
          label="Número de Lista *"
          type="number"
          placeholder="Ej: 1"
          value={numeroLista}
          onChange={(e) => setNumeroLista(e.target.value)}
          icon={<HashtagIcon className="w-5 h-5" />}
          min="1"
          fullWidth
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Número que aparecerá en la papeleta de votación
        </p>
      </div>

      {/* Confirmación final */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-green-800">Todo listo</h4>
            <p className="text-xs text-green-700 mt-1">
              El candidato será agregado a la elección con la información mostrada arriba.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!numeroLista.trim() || submitting}
          loading={submitting}
          className="w-full bg-sena-600 hover:bg-sena-700"
        >
          {submitting ? 'Agregando Candidato...' : 'Agregar Candidato'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={submitting}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
                    <UserPlusIcon className="w-5 h-5 text-sena-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Agregar Candidato
                    </h2>
                    <p className="text-sm text-gray-500">
                      {step === 'method' && 'Seleccione el método de agregado'}
                      {step === 'search' && 'Busque y seleccione un aprendiz'}
                      {step === 'manual' && 'Complete los datos del candidato'}
                      {step === 'confirm' && 'Confirme la información'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-2 ${step === 'method' ? 'text-sena-600' : step === 'search' || step === 'manual' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'method' ? 'bg-sena-100 text-sena-600' : step === 'search' || step === 'manual' || step === 'confirm' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Método</span>
                  </div>

                  <div className={`flex-1 h-px mx-4 ${step === 'search' || step === 'manual' || step === 'confirm' ? 'bg-green-300' : 'bg-gray-300'}`} />

                  <div className={`flex items-center space-x-2 ${step === 'search' || step === 'manual' ? 'text-sena-600' : step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'search' || step === 'manual' ? 'bg-sena-100 text-sena-600' : step === 'confirm' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Datos</span>
                  </div>

                  <div className={`flex-1 h-px mx-4 ${step === 'confirm' ? 'bg-green-300' : 'bg-gray-300'}`} />

                  <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-sena-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'confirm' ? 'bg-sena-100 text-sena-600' : 'bg-gray-100 text-gray-400'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Confirmar</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 'method' && renderStepMethod()}
                    {step === 'search' && renderStepSearch()}
                    {step === 'manual' && renderStepManual()}
                    {step === 'confirm' && renderStepConfirm()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddCandidateModal