import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { 
  ShieldCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  HomeIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'


const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              {/* Logo SENA más profesional */}
              <div className="w-12 h-12 bg-gradient-to-br from-sena-500 to-sena-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-gray-900">SENA</div>
                <div className="text-xs text-gray-500 -mt-1">Sistema de Votaciones</div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-sena-600 transition-colors font-medium">
                Inicio
              </a>
              <a href="#" className="text-gray-600 hover:text-sena-600 transition-colors font-medium">
                Resultados
              </a>
              <a href="#" className="text-gray-600 hover:text-sena-600 transition-colors font-medium">
                Ayuda
              </a>
            </nav>
            
            <Button variant="primary" size="sm" className="shadow-lg">
              Acceder
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-sena-50/30"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-sena-100/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-sena-100/20 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-sena-100 text-sena-800 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-sena-500 rounded-full mr-2"></span>
                Sistema Oficial SENA
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                Votaciones
                <span className="block bg-gradient-to-r from-sena-600 to-sena-500 bg-clip-text text-transparent">
                  Democráticas
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Plataforma digital segura para elecciones estudiantiles del 
                <span className="font-semibold text-sena-600"> Servicio Nacional de Aprendizaje</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button size="lg" className="px-10 py-4 text-lg shadow-xl hover:shadow-2xl">
                  Iniciar Votación
                </Button>
                <Button variant="outline" size="lg" className="px-10 py-4 text-lg border-2">
                  Ver Resultados en Vivo
                </Button>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-20 relative"
            >
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-sena-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <ShieldCheckIcon className="w-6 h-6 text-sena-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Voto Seguro</div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-sena-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <ChartBarIcon className="w-6 h-6 text-sena-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Tiempo Real</div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-sena-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <CheckCircleIcon className="w-6 h-6 text-sena-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Transparente</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Democracia Digital para el SENA
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Nuestro sistema de votaciones representa la evolución natural de los procesos democráticos 
                en el Servicio Nacional de Aprendizaje, garantizando participación estudiantil transparente 
                y segura en todas las regiones de Colombia.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Desde elecciones de representantes estudiantiles hasta consultas institucionales, 
                facilitamos la voz de la comunidad educativa con tecnología de vanguardia.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-sena-600 mb-2">33</div>
                  <div className="text-sm text-gray-600">Regionales SENA</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-sena-600 mb-2">117</div>
                  <div className="text-sm text-gray-600">Centros de Formación</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-sena-50 to-gray-100 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-sena-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-3xl font-bold">SENA</span>
                  </div>
                  <div className="text-gray-600 text-lg">Representación visual del sistema</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Proceso de Votación
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, seguro y transparente en cada paso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Autenticación",
                description: "Escanea tu código QR único para acceder al sistema de votación."
              },
              {
                step: "02", 
                title: "Selección",
                description: "Elige tu candidato preferido de forma privada y segura."
              },
              {
                step: "03",
                title: "Confirmación",
                description: "Confirma tu voto y recibe tu comprobante de verificación."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-sena-500 to-sena-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                    <span className="text-white font-bold text-xl">{item.step}</span>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-sena-200 to-gray-200"></div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Types of Elections Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Tipos de Elecciones
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Adaptado a los diferentes niveles de representación estudiantil en el SENA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Representante de Centro",
                description: "Elección de representantes estudiantiles a nivel de centro de formación",
                scope: "Nivel Centro",
                participants: "Todos los aprendices del centro"
              },
              {
                title: "Líder de Sede",
                description: "Selección de líderes estudiantiles para cada sede específica",
                scope: "Nivel Sede",
                participants: "Aprendices de la sede"
              },
              {
                title: "Vocero de Ficha",
                description: "Designación de voceros por programa de formación",
                scope: "Nivel Ficha",
                participants: "Aprendices del programa"
              }
            ].map((election, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-sena-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-sena-600 text-xl font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{election.title}</h3>
                <p className="text-gray-600 mb-4">{election.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Alcance:</span>
                    <span className="font-medium text-sena-600">{election.scope}</span>
                  </div>
                  <div className="text-sm text-gray-500">{election.participants}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Seguridad y Transparencia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tecnología avanzada para garantizar la integridad de cada voto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <LockClosedIcon className="w-8 h-8 text-sena-600" />,
                title: "Encriptación",
                description: "Todos los votos son encriptados con estándares de seguridad bancaria"
              },
              {
                icon: <DevicePhoneMobileIcon className="w-8 h-8 text-sena-600" />,
                title: "Códigos QR",
                description: "Autenticación única e intransferible para cada votante"
              },
              {
                icon: <MagnifyingGlassIcon className="w-8 h-8 text-sena-600" />,
                title: "Auditoría",
                description: "Rastro completo de cada acción para verificación posterior"
              },
              {
                icon: <BoltIcon className="w-8 h-8 text-sena-600" />,
                title: "Tiempo Real",
                description: "Monitoreo instantáneo de participación y resultados"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-sena-500 to-sena-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Tu Voz, Tu Voto, Tu Futuro
            </h2>
            <p className="text-xl text-sena-100 mb-12 max-w-2xl mx-auto">
              Participa en la construcción democrática de tu institución educativa. 
              Cada voto cuenta para el futuro del SENA.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="px-12 py-4 text-lg shadow-2xl hover:shadow-3xl bg-white text-sena-600 hover:bg-gray-50"
            >
              Comenzar a Votar Ahora
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Logo y descripción */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-sena-500 to-sena-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <div className="text-2xl font-bold">SENA</div>
                  <div className="text-sm text-gray-400">Servicio Nacional de Aprendizaje</div>
                </div>
              </div>
              <p className="text-gray-400 max-w-lg mb-6 leading-relaxed">
                Sistema oficial de votaciones electrónicas para elecciones democráticas 
                y transparentes en todas las regionales del Servicio Nacional de Aprendizaje de Colombia.
              </p>
              <div className="text-sm text-gray-500">
                <p className="mb-1">📍 Dirección: Calle 57 No. 8-69, Bogotá D.C.</p>
                <p className="mb-1">📞 Línea Gratuita: 018000 910270</p>
                <p>🌐 www.sena.edu.co</p>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div className="space-y-3">
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <HomeIcon className="w-4 h-4 mr-2" />
                Inicio
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <CheckBadgeIcon className="w-4 h-4 mr-2" />
                Votar Ahora
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Ver Resultados
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Elecciones Activas
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
                Centro de Ayuda
              </a>
            </div>

            {/* Información institucional */}
            <div className="space-y-3">
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Términos y Condiciones
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Política de Privacidad
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <LockClosedIcon className="w-4 h-4 mr-2" />
                Seguridad del Sistema
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <PhoneIcon className="w-4 h-4 mr-2" />
                Mesa de Ayuda
              </a>
              <a href="#" className="flex items-center text-gray-400 hover:text-sena-400 transition-colors">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Contacto Técnico
              </a>
            </div>
          </div>

          {/* Línea separadora y copyright */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 lg:mb-0">
                <p>&copy; 2025 SENA - Servicio Nacional de Aprendizaje</p>
                <p className="text-xs mt-1">Todos los derechos reservados - República de Colombia</p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Sistema Activo
                </span>
                <span>Versión 1.0.0</span>
                <span>Última actualización: Junio 2025</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing