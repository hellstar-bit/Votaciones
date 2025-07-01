import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (documentNumber: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false); // ⭐ NUEVO: Prevenir múltiples escaneos

  useEffect(() => {
    // Configuración del scanner
    const config = {
      fps: 10, // Frames por segundo
      qrbox: { width: 250, height: 250 }, // Área de escaneo
      aspectRatio: 1.0,
      // Remover supportedScanTypes si causa problemas
    };

    // Función cuando se escanea exitosamente
    const onScanSuccessHandler = (decodedText: string, decodedResult: any) => {
      // ⭐ PREVENIR MÚLTIPLES EJECUCIONES
      if (hasScanned) {
        console.log('🚫 Ya se escaneó un QR, ignorando...');
        return;
      }
      
      console.log('QR Escaneado RAW:', decodedText);
      
      // ⭐ MARCAR COMO ESCANEADO INMEDIATAMENTE
      setHasScanned(true);
      
      // ⭐ VERIFICAR QUE EL SCANNER SIGA ACTIVO
      if (!scannerRef.current) {
        console.log('Scanner ya limpiado, ignorando...');
        return;
      }
      
      // Detener el scanner
      const currentScanner = scannerRef.current;
      scannerRef.current = null; // ⭐ MARCAR COMO NULL INMEDIATAMENTE
      
      currentScanner.clear().then(() => {
        setIsScanning(false);
        onScanSuccess(decodedText);
      }).catch(err => {
        console.error('Error al limpiar scanner:', err);
        // Aún así ejecutar el callback
        onScanSuccess(decodedText);
      });
    };

    // Función para manejar errores de escaneo
    const onScanFailureHandler = (error: string) => {
      // NO hacer nada aquí - los errores de escaneo son normales
      // Solo log para debugging
      // console.log('Error de escaneo (normal):', error);
    };

    // Inicializar scanner
    const initScanner = () => {
      try {
        // ⭐ RESET el flag de escaneo
        setHasScanned(false);
        
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          config,
          false // verbose logging
        );

        scannerRef.current.render(onScanSuccessHandler, onScanFailureHandler);
        setIsScanning(true);
        setError('');
      } catch (err) {
        console.error('Error inicializando scanner:', err);
        setError('Error al inicializar la cámara');
        onScanError?.('Error al inicializar la cámara');
      }
    };

    initScanner();

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Error en cleanup:', err);
        });
        scannerRef.current = null; // ⭐ LIMPIAR REFERENCIA
      }
    };
  }, [onScanSuccess, onScanError]);

  const handleClose = () => {
    if (scannerRef.current) {
      const currentScanner = scannerRef.current;
      scannerRef.current = null; // ⭐ LIMPIAR INMEDIATAMENTE
      
      currentScanner.clear().then(() => {
        setIsScanning(false);
        onClose();
      }).catch(err => {
        console.error('Error cerrando scanner:', err);
        onClose(); // Cerrar de todas formas
      });
    } else {
      onClose();
    }
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-content">
        <div className="qr-scanner-header">
          <h3>Escanear Carné SENA</h3>
          <button onClick={handleClose} className="close-button">
            ✕
          </button>
        </div>
        
        <div className="qr-scanner-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div id="qr-reader" style={{ width: '100%' }}></div>
          
          <div className="scanner-instructions">
            <p>Posiciona el código QR del carné dentro del recuadro</p>
            <p>El escaneo se realizará automáticamente</p>
          </div>
          
          {isScanning && (
            <div className="scanning-indicator">
              <span>🔍 Escaneando...</span>
            </div>
          )}
        </div>
        
        <div className="qr-scanner-footer">
          <button onClick={handleClose} className="cancel-button">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;