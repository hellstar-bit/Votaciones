import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-sena-500 hover:bg-sena-600 text-white shadow-sm hover:shadow-md focus:ring-sena-500',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow-md focus:ring-gray-500',
      outline: 'border-2 border-sena-500 text-sena-600 hover:bg-sena-50 focus:ring-sena-500',
      ghost: 'text-sena-600 hover:bg-sena-50 focus:ring-sena-500'
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
    
    // 🔧 SOLUCION: Filtrar solo las props problemáticas que causaban conflictos
    // Removemos solo las props que NO son estándar de HTML button
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => 
        // Mantener todas las props estándar incluyendo onClick, onSubmit, etc.
        !key.startsWith('while') && // Remover props de Framer Motion personalizadas
        key !== 'initial' && 
        key !== 'animate' && 
        key !== 'exit' &&
        key !== 'transition'
      )
    )
    
    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...filteredProps} // 🎯 Ahora incluye onClick y otros event handlers
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {icon && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button