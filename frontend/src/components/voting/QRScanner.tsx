// QRScanner.tsx
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  CameraIcon, 
  QrCodeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface QRScannerProps {
  onScan: (data: any) => void
}

const QRScanner = ({ onScan }: QRScannerProps) => {
  const [method, setMethod] = useState<'camera' | 'manual' | 'file'>('camera')
  const [manualInput, setManualInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simular escaneo con cámara
  const handleCameraScan = () => {
    setIsScanning(true)
    
    // Simular delay de escaneo
    setTimeout(() => {
      // Datos de ejemplo para testing
      const mockQRData = {
        numero_documento: '1234567890',
        nombre: 'Juan Pérez',
        tipo: 'estudiante'
      }
      
      setIsScanning(false)
      onScan(mockQRData)
    }, 2000)
  }

  // Procesar entrada manual
  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      return
    }

    try {
      // Intentar parsear como JSON
      const data = JSON.parse(manualInput)
      onScan(data)
    } catch {
      // Si no es JSON, asumir que es solo el número de documento
      onScan({ numero_documento: manualInput.trim() })
    }
  }

  // Leer archivo QR
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // En una implementación real, aquí usarías una librería como qr-scanner
    // Para testing, simular lectura exitosa
    const mockData = {
      numero_documento: '9876543210',
      nombre: 'María González',
      tipo: 'estudiante'
    }
    
    onScan(mockData)
  }

  return (
    <div className="space-y-6">
      {/* Selector de método */}
      <div className="flex justify-center space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setMethod('camera')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            method === 'camera'
              ? 'bg-white text-sena-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CameraIcon className="w-4 h-4 inline mr-2" />
          Cámara
        </button>
        <button
          onClick={() => setMethod('manual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            method === 'manual'
              ? 'bg-white text-sena-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4 inline mr-2" />
          Manual
        </button>
        <button
          onClick={() => setMethod('file')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            method === 'file'
              ? 'bg-white text-sena-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <QrCodeIcon className="w-4 h-4 inline mr-2" />
          Archivo
        </button>
      </div>

      {/* Método: Cámara */}
      {method === 'camera' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="bg-gray-900 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
            {isScanning ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-center"
              >
                <div className="w-16 h-16 border-4 border-sena-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Escaneando...</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Vista previa de la cámara</p>
                <div className="absolute inset-4 border-2 border-sena-500 rounded-lg"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-sena-500 rounded-lg"></div>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleCameraScan}
            disabled={isScanning}
            className="px-8 py-3"
          >
            {isScanning ? 'Escaneando...' : 'Iniciar Escaneo'}
          </Button>
          
          <p className="text-sm text-gray-500">
            Coloca el código QR dentro del marco para escanearlo
          </p>
        </motion.div>
      )}

      {/* Método: Manual */}
      {method === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento o Datos JSON
            </label>
            <Input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='1234567890 o {"numero_documento": "1234567890", "nombre": "Juan Pérez"}'
              className="font-mono"
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          
          <Button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            className="w-full"
          >
            Procesar Datos
          </Button>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Formatos aceptados:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Número de documento: <code>1234567890</code></li>
                <li>• JSON completo: <code>{`{"numero_documento": "1234567890"}`}</code></li></ul>
            </div>
        </motion.div>
      )}

      {/* Método: Archivo */}
      {method === 'file' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-sena-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Haz clic para seleccionar imagen QR</p>
            <p className="text-sm text-gray-500">PNG, JPG, JPEG hasta 10MB</p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Modo de prueba</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  En producción, este método leería códigos QR reales de imágenes usando librerías especializadas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default QRScanner