// 📁 frontend/src/stores/authStore.ts - VERSIÓN SIN PERSIST PARA DEBUGGING
import { create } from 'zustand'
// import { persist } from 'zustand/middleware' // ← COMENTADO

interface User {
  id: number
  username: string
  nombre_completo: string
  rol: 'ADMIN' | 'DASHBOARD' | 'MESA_VOTACION' | 'INSTRUCTOR' | 'APRENDIZ'
  centro?: string
  sede?: string
  ficha?: string
  jornada?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  // persist( // ← COMENTADO TEMPORALMENTE
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        
        try {
          console.log('🔐 Intentando login con:', credentials.username)
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
          })

          console.log('📡 Response status:', response.status)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error de autenticación' }))
            throw new Error(errorData.message || 'Credenciales incorrectas')
          }

          const data = await response.json()
          console.log('✅ Login exitoso:', data)

          if (!data.access_token || !data.user) {
            throw new Error('Respuesta del servidor incompleta')
          }

          set({
            user: {
              id: data.user.id,
              username: data.user.username,
              nombre_completo: data.user.nombre_completo,
              rol: data.user.rol,
              centro: data.user.centro,
              sede: data.user.sede,
              ficha: data.user.ficha,
              jornada: data.user.jornada,
            },
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false
          })

          console.log('💾 Estado actualizado en store')

        } catch (error) {
          console.error('❌ Error en login:', error)
          set({ 
            isLoading: false,
            user: null,
            token: null,
            isAuthenticated: false
          })
          throw error
        }
      },

      logout: () => {
        console.log('🚪 Cerrando sesión')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      }
    })
  // ) // ← COMENTADO TEMPORALMENTE
)