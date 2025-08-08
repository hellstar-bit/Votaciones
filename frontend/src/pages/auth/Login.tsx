// 📁 frontend/src/pages/auth/Login.tsx - NAVEGACIÓN CORREGIDA PARA REACT ROUTER V7
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
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
  
  const { login, isLoading } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginForm>()

  // 🔧 SOLUCIÓN: Función de navegación que evita el error insertBefore
  const navigateAfterLogin = (user: any) => {
    // Pequeño delay para permitir que el state se actualice completamente
    setTimeout(() => {
      // 🔧 CRÍTICO: Usar window.location.href en lugar de navigate()
      // Esto fuerza un reload completo y evita problemas de React Router v7
      switch (user.rol) {
        case 'ADMIN':
          window.location.href = '/admin'
          break
        case 'DASHBOARD':
          window.location.href = '/real-time-dashboard'
          break
        case 'MESA_VOTACION':
          window.location.href = '/voting'
          break
        case 'INSTRUCTOR':
          window.location.href = '/instructor'
          break
        default:
          window.location.href = '/dashboard'
      }
    }, 100)
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('🔐 Iniciando proceso de login...')
      
      await login(data)
      console.log('✅ Login exitoso')
      
      toast.success('¡Bienvenido al sistema!')
      
      // 🔧 CORRECCIÓN: Obtener el usuario del store después del login exitoso
      const { user } = useAuthStore.getState()
      
      if (user) {
        navigateAfterLogin(user)
      } else {
        // Fallback si hay algún problema
        window.location.href = '/dashboard'
      }
      
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
          {/* Error general */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            </div>
          )}

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
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          {/* Links adicionales */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Problemas para acceder?{' '}
              <a href="#" className="font-medium text-green-600 hover:text-green-500">
                Contacta al administrador
              </a>
            </p>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  )
}

export default Login