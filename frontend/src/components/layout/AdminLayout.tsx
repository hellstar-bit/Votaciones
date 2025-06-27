// AdminLayout.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'

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

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      current: location.pathname === '/admin'
    },
    {
      name: 'Mesa de Votación',
      href: '/admin/voting',
      icon: QueueListIcon,
      current: location.pathname === '/admin/voting'
    },
    {
      name: 'Gestión de Usuarios',
      href: '/admin/users',
      icon: UsersIcon,
      current: location.pathname === '/admin/users',
      disabled: true
    },
    {
      name: 'Reportes',
      href: '/admin/reports',
      icon: ChartBarIcon,
      current: location.pathname === '/admin/reports',
      disabled: true
    },
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/admin/settings',
      disabled: true
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
              {collapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          )
        )}
      </div>

      {/* Información del usuario */}
      {(!collapsed || mobile) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-4 bg-gradient-to-r from-sena-50 to-green-50 border-b border-sena-100"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sena-100 rounded-full flex items-center justify-center ring-2 ring-sena-200">
              <span className="text-sena-600 font-semibold text-sm">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nombre_completo}
              </p>
              <p className="text-xs text-sena-600 font-medium">{user?.rol}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Avatar colapsado */}
      {collapsed && !mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-4 flex justify-center"
        >
          <div className="w-10 h-10 bg-sena-100 rounded-full flex items-center justify-center ring-2 ring-sena-200">
            <span className="text-sena-600 font-semibold text-sm">
              {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="relative group">
              <button
                onClick={() => onNavigate(item.href, item.disabled)}
                disabled={item.disabled}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  item.current
                    ? 'bg-gradient-to-r from-sena-500 to-sena-600 text-white shadow-lg'
                    : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed && !mobile ? 'justify-center' : 'space-x-3'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                
                <AnimatePresence>
                  {(!collapsed || mobile) && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="font-medium truncate">{item.name}</span>
                      {item.disabled && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          Próximo
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Tooltip para modo colapsado */}
              {collapsed && !mobile && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                  {item.disabled && (
                    <span className="ml-1 text-gray-300">(Próximamente)</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer con botón de logout */}
      <div className="p-3 border-t border-gray-200">
        <div className="relative group">
          <Button
            variant="outline"
            onClick={onLogout}
            className={`w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 ${
              collapsed && !mobile ? 'px-2' : 'justify-start'
            }`}
            icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
          >
            <AnimatePresence>
              {(!collapsed || mobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-2"
                >
                  Cerrar Sesión
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {/* Tooltip para logout colapsado */}
          {collapsed && !mobile && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Cerrar Sesión
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout