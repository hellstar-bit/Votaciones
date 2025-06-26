
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText, 
    icon, 
    fullWidth = false,
    type = 'text',
    ...props 
  }, ref) => {
    const inputClasses = `
      block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors duration-200
      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-sena-500 focus:ring-sena-500'
      }
      ${icon ? 'pl-10' : ''}
      ${className}
    `
    
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={`text-gray-400 ${error ? 'text-red-400' : ''}`}>
                {icon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            className={inputClasses}
            {...props}
          />
        </div>
        
        {(error || helperText) && (
          <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input