// 📁 frontend/src/App.tsx - AGREGAR AUTHSTORE PARA TEST
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from './stores/authStore'  // ← AGREGADO

// ✅ LOGIN CON AUTHSTORE PARA TEST
const SimpleLogin = () => {
  const { login, isLoading, user } = useAuthStore()  // ← AGREGADO

  const handleSubmit = async () => {
    console.log('🔄 Navegando con AuthStore...')
    
    try {
      // ✅ TEST: USAR AUTHSTORE REAL
      await login({ username: 'admin', password: 'Admin123!' })
      
      toast.success('¡Login exitoso con AuthStore!')
      
      // ✅ TEST: OBTENER USUARIO DEL STORE
      const { user } = useAuthStore.getState()
      console.log('👤 Usuario:', user)
      
      setTimeout(() => {
        window.location.href = '/admin'
      }, 100)
      
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Error en login')
    }
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Login Simple</h1>
      
      {/* ✅ TEST: AGREGAR ICONOS SVG (SOSPECHOSO #2) */}
      <div style={{ margin: '20px 0' }}>
        <UserIcon style={{ width: '24px', height: '24px', display: 'inline-block', marginRight: '10px' }} />
        <span>Usuario</span>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <LockClosedIcon style={{ width: '24px', height: '24px', display: 'inline-block', marginRight: '10px' }} />
        <span>Contraseña</span>
      </div>
      
      <button 
        onClick={handleSubmit}
        disabled={isLoading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: isLoading ? '#gray' : '#22c55e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Cargando...' : 'Login con AuthStore + Zustand'}
      </button>
      
      {/* ✅ TEST: MOSTRAR ESTADO DEL USUARIO */}
      {user && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <p>👤 Usuario logueado: {user.username}</p>
          <p>🔑 Rol: {user.rol}</p>
        </div>
      )}
    </div>
  )
}

// ✅ ADMIN CON PROTECCIÓN SIMPLE
const SimpleAdmin = () => {
  const { user, isAuthenticated } = useAuthStore()  // ← AGREGADO

  // ✅ TEST: VERIFICACIÓN SIMPLE
  if (!isAuthenticated || !user) {
    return (
      <div style={{ padding: '50px', color: 'red' }}>
        <h1>❌ NO AUTENTICADO</h1>
        <p>Redirigiendo a login...</p>
      </div>
    )
  }

  if (user.rol !== 'ADMIN') {
    return (
      <div style={{ padding: '50px', color: 'orange' }}>
        <h1>⚠️ SIN PERMISOS</h1>
        <p>Rol actual: {user.rol}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>🎯 ADMIN PAGE - CON AUTHSTORE</h1>
      <p>✅ Usuario: {user.username}</p>
      <p>✅ Rol: {user.rol}</p>
      <p>Si ves esto sin error, AuthStore funciona bien</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/admin" element={<SimpleAdmin />} />
        <Route path="*" element={<SimpleLogin />} />
      </Routes>
      
      {/* ✅ TEST: AGREGAR TOASTER (SOSPECHOSO #1) */}
      <Toaster position="top-right" />
    </Router>
  )
}

export default App