import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import styles from './CameraScanner.module.css';

interface CameraScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function CameraScanner({ onScan, onError }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          onScan(decodedText);
          stopScanner();
        },
        (_errorMessage: string) => {
          // Ignore scan errors (no QR found)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Impossible d\'accéder à la caméra';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const toggleCamera = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [facingMode]);

  return (
    <div className={styles.container}>
      <div id="qr-reader" ref={containerRef} className={styles.scanner} />
      
      {error && (
        <div className={styles.error}>
          <CameraOff size={32} />
          <p>{error}</p>
          <button className={styles.retryButton} onClick={startScanner}>
            <RefreshCw size={18} />
            Réessayer
          </button>
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={toggleCamera}
          disabled={!isScanning}
          aria-label="Changer de caméra"
        >
          <Camera size={24} />
          <span>Changer caméra</span>
        </button>
      </div>

      <div className={styles.overlay}>
        <div className={styles.scanArea}>
          <div className={styles.corner + ' ' + styles.topLeft} />
          <div className={styles.corner + ' ' + styles.topRight} />
          <div className={styles.corner + ' ' + styles.bottomLeft} />
          <div className={styles.corner + ' ' + styles.bottomRight} />
        </div>
        <p className={styles.hint}>Placez le QR code dans le cadre</p>
      </div>
    </div>
  );
}
