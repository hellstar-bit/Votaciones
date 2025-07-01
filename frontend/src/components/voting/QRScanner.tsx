import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { XMarkIcon, CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface QRScannerProps {
  onScanSuccess: (documentNumber: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    let styleElement: HTMLStyleElement | null = null;

    const injectStyles = () => {
      styleElement = document.createElement('style');
      styleElement.textContent = `
        /* Estilos mínimos para el QR Scanner */
        #qr-reader {
          width: 100% !important;
          border: none !important;
        }
        
        #qr-reader video {
          width: 100% !important;
          max-width: 300px !important;
          height: auto !important;
          aspect-ratio: 1 !important;
          object-fit: cover !important;
          border-radius: 12px !important;
          margin: 0 auto !important;
          display: block !important;
        }
        
        /* Ocultar solo los controles innecesarios */
        #qr-reader__dashboard_section_fsr {
          display: none !important;
        }
        
        #qr-reader__dashboard_section_csr select {
          margin: 8px 0 !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
        
        /* Mejorar la región de escaneo */
        #qr-reader__scan_region {
          border: 2px solid #10b981 !important;
          border-radius: 12px !important;
        }
        
        /* Status mejorado */
        #qr-reader__status_span {
          color: #374151 !important;
          font-size: 14px !important;
          padding: 8px 12px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 8px !important;
          margin: 8px !important;
          font-weight: 500 !important;
        }
        
        /* Dashboard más compacto */
        #qr-reader__dashboard {
          margin-top: 16px !important;
        }
        
        #qr-reader__dashboard_section {
          margin: 8px 0 !important;
        }
      `;
      document.head.appendChild(styleElement);
    };

    const initScanner = () => {
      try {
        setHasScanned(false);
        setError('');
        
        // Inyectar estilos
        injectStyles();
        
        // Configuración básica
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          config,
          false
        );

        const onScanSuccessHandler = (decodedText: string) => {
          if (hasScanned || !scannerRef.current) {
            return;
          }
          
          console.log('QR Escaneado:', decodedText);
          setHasScanned(true);
          
          const currentScanner = scannerRef.current;
          scannerRef.current = null;
          
          currentScanner.clear().then(() => {
            setIsScanning(false);
            onScanSuccess(decodedText);
          }).catch(err => {
            console.error('Error limpiando scanner:', err);
            onScanSuccess(decodedText);
          });
        };

        const onScanFailureHandler = () => {
          // Ignorar errores normales de escaneo
        };

        scannerRef.current.render(onScanSuccessHandler, onScanFailureHandler);
        setIsScanning(true);
        
      } catch (err) {
        console.error('Error inicializando scanner:', err);
        setError('Error al acceder a la cámara. Verifica los permisos.');
        onScanError?.('Error al inicializar la cámara');
      }
    };

    // Delay para asegurar que el DOM esté listo
    const timer = setTimeout(initScanner, 200);

    return () => {
      clearTimeout(timer);
      
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Error en cleanup:', err);
        });
        scannerRef.current = null;
      }
      
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current) {
      const currentScanner = scannerRef.current;
      scannerRef.current = null;
      
      currentScanner.clear().then(() => {
        setIsScanning(false);
        onClose();
      }).catch(err => {
        console.error('Error cerrando scanner:', err);
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-sena-100 rounded-lg flex items-center justify-center mr-3">
              <CameraIcon className="w-5 h-5 text-sena-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Escanear Carné SENA
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">Error de cámara</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scanner container */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div id="qr-reader"></div>
              </div>

              {/* Instrucciones */}
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Centra el código QR en el recuadro verde
                </p>
                <p className="text-xs text-gray-500">
                  Mantén el carné estable para un mejor escaneo
                </p>
              </div>

              {/* Indicador de escaneo */}
              {isScanning && (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-green-700 font-medium">
                      Buscando código QR...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;