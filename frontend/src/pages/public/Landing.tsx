import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'

const Landing = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-sena-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                SENA Votaciones
              </span>
            </div>
            
            <Button variant="outline" size="sm">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Sistema de
                <span className="block text-sena-500">
                  Votaciones SENA
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Plataforma digital para elecciones democráticas y transparentes 
                de representantes estudiantiles en el Servicio Nacional de Aprendizaje.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8">
                  Acceder al Sistema
                </Button>
                <Button variant="outline" size="lg">
                  Ver Resultados
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-sena-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-sena-200 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-sena-300 rounded-full opacity-40"></div>
      </section>


      {/* CTA Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para participar?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Tu voz cuenta. Únete a la democracia estudiantil del SENA.
          </p>
          <Button size="lg" className="px-8">
            Comenzar Votación
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-sena-500 rounded flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-gray-600">
                © 2025 SENA - Sistema de Votaciones
              </span>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-sena-500">Términos</a>
              <a href="#" className="hover:text-sena-500">Privacidad</a>
              <a href="#" className="hover:text-sena-500">Soporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing