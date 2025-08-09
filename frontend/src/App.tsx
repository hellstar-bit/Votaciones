// 📁 frontend/src/App.tsx - AGREGAR TOASTER PARA TEST
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'  // ← AGREGADO
import toast from 'react-hot-toast'         // ← AGREGADO

// ✅ LOGIN ULTRA SIMPLE SIN NADA
const SimpleLogin = () => {
  const handleSubmit = () => {
    console.log('🔄 Navegando...')
    
    // ✅ TEST: ACTIVAR TOASTER
    toast.success('¡Navegando a admin!')
    
    setTimeout(() => {
      window.location.href = '/admin'
    }, 100)
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Login Simple</h1>
      <button 
        onClick={handleSubmit}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#22c55e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Ir a Admin (sin SVG, sin iconos)
      </button>
    </div>
  )
}

// ✅ ADMIN ULTRA SIMPLE
const SimpleAdmin = () => {
  return (
    <div style={{ padding: '50px' }}>
      <h1>🎯 ADMIN PAGE - ULTRA SIMPLE</h1>
      <p>Si ves esto sin error, el problema estaba en los componentes complejos</p>
      <p>Si aún da error, es problema de React 18 + Vite + Router</p>
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