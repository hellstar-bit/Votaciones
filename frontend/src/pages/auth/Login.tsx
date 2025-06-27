import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { AuthLayout } from '../../components/layout/Layout'
import { useAuthStore } from '../../stores/authStore'

interface LoginForm {
  username: string
  password: string
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  
  // 🔧 CORREGIR: Extraer correctamente login e isLoading del store
  const { login, isLoading } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginForm>()

  // 🔧 FUNCIÓN CORREGIDA DE SUBMIT
  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('🔐 Iniciando proceso de login...')
      await login(data)
      console.log('✅ Login exitoso, redirigiendo...')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      setError('root', {
        message: error.message || 'Credenciales incorrectas. Intenta de nuevo.'
      })
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso al Sistema
          </h1>
          <p className="text-gray-600">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo Usuario */}
          <div>
            <Input
              label="Usuario"
              placeholder="Ingresa tu usuario"
              icon={<UserIcon className="w-5 h-5" />}
              fullWidth
              error={errors.username?.message}
              {...register('username', {
                required: 'El usuario es requerido',
                minLength: {
                  value: 3,
                  message: 'El usuario debe tener al menos 3 caracteres'
                }
              })}
            />
          </div>

          {/* Campo Contraseña */}
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              icon={<LockClosedIcon className="w-5 h-5" />}
              fullWidth
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                }
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Error General */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <p className="text-red-600 text-sm font-medium">
                {errors.root.message}
              </p>
            </motion.div>
          )}

          {/* Botón Login */}
          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Información de prueba */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Credenciales de prueba:
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Admin:</strong> admin / Admin123!</div>
            <div><strong>Mesa:</strong> mesa / Mesa123!</div>
            <div><strong>Instructor:</strong> instructor / Instructor123!</div>
          </div>
        </motion.div>

        {/* Enlaces adicionales */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500">
            ¿Problemas para acceder?{' '}
            <a href="#" className="text-sena-600 hover:text-sena-700 font-medium">
              Contacta al administrador
            </a>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-sena-600 transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export default Login