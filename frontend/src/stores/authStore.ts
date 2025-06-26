import { create } from 'zustand'

interface User {
  id: number
  username: string
  nombre_completo: string
  rol: 'ADMIN' | 'MESA_VOTACION' | 'INSTRUCTOR' | 'APRENDIZ'
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
  
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true })
    
    try {
      // Simulación para demo
      const mockUser: User = {
        id: 1,
        username: credentials.username,
        nombre_completo: 'Usuario Demo',
        rol: credentials.username === 'admin' ? 'ADMIN' : 
             credentials.username === 'mesa' ? 'MESA_VOTACION' : 
             credentials.username === 'instructor' ? 'INSTRUCTOR' : 'APRENDIZ',
        centro: 'Centro Nacional Colombo Alemán',
        sede: 'Sede TIC',
        ficha: '3037689',
        jornada: 'mixta'
      }

      set({
        user: mockUser,
        token: 'demo-jwt-token',
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
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
}))