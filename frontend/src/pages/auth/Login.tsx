// 📁 frontend/src/pages/auth/Login.tsx - NAVEGACIÓN DIRECTA SIN CADENA
import { useState } from 'react'
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

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('🔐 Iniciando login...')
      
      await login(data)
      console.log('✅ Login exitoso')
      
      // 🔧 OBTENER USUARIO DEL STORE
      const { user } = useAuthStore.getState()
      console.log('👤 Usuario logueado:', user)
      
      toast.success('¡Acceso concedido!')
      
      // 🔧 CRÍTICO: IR DIRECTO SIN PASAR POR /dashboard
      if (user?.rol === 'ADMIN') {
        console.log('➡️ Redirigiendo a /admin')
        setTimeout(() => window.location.href = '/admin', 100)
      } else if (user?.rol === 'DASHBOARD') {
        console.log('➡️ Redirigiendo a /real-time-dashboard')
        setTimeout(() => window.location.href = '/real-time-dashboard', 100)
      } else if (user?.rol === 'MESA_VOTACION') {
        console.log('➡️ Redirigiendo a /voting')
        setTimeout(() => window.location.href = '/voting', 100)
      } else {
        console.log('➡️ Redirigiendo a fallback')
        setTimeout(() => window.location.href = '/admin', 100) // Fallback para testing
      }
      
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      setError('root', {
        message: error.message || 'Credenciales incorrectas'
      })
    }
  }

  return (
    <AuthLayout>
      <div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso al Sistema
          </h1>
          <p className="text-gray-600">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            </div>
          )}

          <Input
            label="Usuario"
            placeholder="Ingresa tu usuario"
            icon={<UserIcon className="w-5 h-5" />}
            fullWidth
            error={errors.username?.message}
            {...register('username', {
              required: 'El usuario es requerido'
            })}
          />

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              icon={<LockClosedIcon className="w-5 h-5" />}
              fullWidth
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es requerida'
              })}
            />
            <button
              type="button"
              className="absolute right-0 top-6 pr-3 flex items-center h-11"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login