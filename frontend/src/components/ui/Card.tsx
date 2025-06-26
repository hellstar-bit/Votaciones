import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = ({ 
  className = '', 
  variant = 'default', 
  padding = 'md',
  children, 
  ...props 
}: CardProps) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    outlined: 'bg-white border-2 border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-100'
  }
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const classes = `
    rounded-xl transition-shadow duration-200 hover:shadow-md
    ${variants[variant]} 
    ${paddings[padding]} 
    ${className}
  `
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Subcomponentes para estructura
const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`pb-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
)

const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`py-4 ${className}`} {...props}>
    {children}
  </div>
)

const CardFooter = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`pt-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
)

const CardDescription = ({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
)

export default Card
export { CardHeader, CardContent, CardFooter, CardTitle, CardDescription }