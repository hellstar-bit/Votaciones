// 📁 frontend/src/components/layout/AdminLayout.tsx - ACTUALIZADO
import { useState } from 'react'
const motion = {
  div: (props: any) => React.createElement('div', props),
  button: (props: any) => React.createElement('button', props),
  span: (props: any) => React.createElement('span', props)
}
const AnimatePresence = ({ children }: any) => children
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeIcon,
  QueueListIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,        // ✅ NUEVO: Para gestión de aprendices
  ArrowUpTrayIcon,        // ✅ NUEVO: Para importación
  PresentationChartBarIcon // ✅ NUEVO: Para dashboard tiempo real
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import React from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Para móvil
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Para desktop

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // ✅ ACTUALIZADO: Array de menuItems con las nuevas opciones
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      current: location.pathname === '/admin'
    },
   
    // ✅ NUEVO: Gestión de Aprendices
    {
      name: 'Gestión de Aprendices',
      href: '/admin/aprendices',
      icon: AcademicCapIcon,
      current: location.pathname === '/admin/aprendices'
    },
    // ✅ NUEVO: Importar Aprendices
    {
      name: 'Importar Aprendices',
      href: '/admin/import',
      icon: ArrowUpTrayIcon,
      current: location.pathname === '/admin/import'
    },
    {
      name: 'Mesa de Votación',
      href: '/admin/voting',
      icon: QueueListIcon,
      current: location.pathname === '/admin/voting'
    },
    {
      name: 'Reportes',
      href: '/admin/reports',
      icon: ChartBarIcon,
      current: location.pathname === '/admin/reports',
      disabled: true // Mantener deshabilitado por ahora
    },
    // ✅ NUEVO: Dashboard Tiempo Real
    {
      name: 'Dashboard Tiempo Real',
      href: '/real-time-dashboard',
      icon: PresentationChartBarIcon,
      current: location.pathname === '/real-time-dashboard'
    },
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/admin/settings',
      disabled: true // Mantener deshabilitado por ahora
    }
  ]

  const handleNavigation = (href: string, disabled?: boolean) => {
    if (disabled) return
    navigate(href)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl"
            >
              <SidebarContent 
                menuItems={menuItems}
                onNavigate={handleNavigation}
                onLogout={handleLogout}
                user={user}
                collapsed={false}
                mobile={true}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar para desktop */}
      <motion.div
        className="hidden lg:block fixed top-0 left-0 h-full bg-white shadow-lg border-r border-gray-200 z-40"
        animate={{ 
          width: sidebarCollapsed ? 72 : 280 
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <SidebarContent 
          menuItems={menuItems}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
          user={user}
          collapsed={sidebarCollapsed}
          mobile={false}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </motion.div>

      {/* Contenido principal */}
      <motion.div
        className="lg:ml-72"
        animate={{ 
          marginLeft: window.innerWidth >= 1024 ? (sidebarCollapsed ? 72 : 280) : 0 
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header móvil */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sena-500 to-sena-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">SENA Admin</span>
            </div>

            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="min-h-screen">
          {children}
        </main>
      </motion.div>
    </div>
  )
}

// Componente del contenido del sidebar
interface SidebarContentProps {
  menuItems: any[]
  onNavigate: (href: string, disabled?: boolean) => void
  onLogout: () => void
  user: any
  collapsed: boolean
  mobile: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
}

const SidebarContent = ({ 
  menuItems, 
  onNavigate, 
  onLogout, 
  user, 
  collapsed, 
  mobile, 
  onClose, 
  onToggleCollapse 
}: SidebarContentProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {(!collapsed || mobile) && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-sena-500 to-sena-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">SENA</h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Botón de cerrar/colapsar */}
        {mobile && onClose ? (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        ) : (
          !mobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {collapsed ? 
                <ChevronRightIcon className="w-5 h-5" /> : 
                <ChevronLeftIcon className="w-5 h-5" />
              }
            </button>
          )
        )}
      </div>

      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {(!collapsed || mobile) && (
            <motion.div
              key="user-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre_completo || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.rol || 'Administrador'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed && !mobile && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = item.current
          const isDisabled = item.disabled

          return (
            <motion.button
              key={item.name}
              onClick={() => onNavigate(item.href, isDisabled)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`
                w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-sena-50 text-sena-700 border-r-4 border-sena-500 shadow-sm' 
                  : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${collapsed && !mobile ? 'justify-center px-2' : ''}
              `}
            >
              <Icon className={`
                ${collapsed && !mobile ? 'w-6 h-6' : 'w-5 h-5 mr-3'} 
                ${isActive ? 'text-sena-500' : isDisabled ? 'text-gray-400' : 'text-gray-400'}
              `} />
              
              <AnimatePresence mode="wait">
                {(!collapsed || mobile) && (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Indicador de deshabilitado */}
              {isDisabled && (!collapsed || mobile) && (
                <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  Próximamente
                </span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer con botón de logout */}
      <div className="p-4 border-t border-gray-200">
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors
            ${collapsed && !mobile ? 'justify-center px-2' : ''}
          `}
        >
          <ArrowRightOnRectangleIcon className={`
            ${collapsed && !mobile ? 'w-6 h-6' : 'w-5 h-5 mr-3'}
          `} />
          
          <AnimatePresence mode="wait">
            {(!collapsed || mobile) && (
              <motion.span
                key="logout-text"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

export default AdminLayout