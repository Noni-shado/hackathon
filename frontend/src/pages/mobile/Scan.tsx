import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calendar, ArrowRight, Keyboard } from 'lucide-react';
import { MobileLayout, CameraScanner } from '../../components/mobile';
import { concentrateursService } from '../../services/concentrateurs.service';
import type { Concentrateur } from '../../types';
import styles from './Scan.module.css';

const etatLabels: Record<string, string> = {
  en_livraison: 'En livraison',
  en_stock: 'En stock',
  pose: 'Posé',
  retour_constructeur: 'Retour',
  hs: 'Hors service',
};

export function Scan() {
  const navigate = useNavigate();
  const [concentrateur, setConcentrateur] = useState<Concentrateur | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSerial, setManualSerial] = useState('');

  const handleScan = async (data: string) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await concentrateursService.verifyConcentrateur(data);
      if (response.exists && response.concentrateur) {
        setConcentrateur(response.concentrateur);
      } else {
        setError(`Concentrateur "${data}" introuvable`);
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualSerial.trim()) return;
    await handleScan(manualSerial.trim());
  };

  const handleCreateAction = () => {
    if (concentrateur) {
      navigate(`/mobile/action/new?numero_serie=${concentrateur.numero_serie}`);
    }
  };

  const handleReset = () => {
    setConcentrateur(null);
    setError(null);
    setManualSerial('');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <MobileLayout title="Scanner QR">
      <div className={styles.container}>
        {!concentrateur && !showManualInput && (
          <div className={styles.scannerContainer}>
            <CameraScanner
              onScan={handleScan}
              onError={(err) => setError(err)}
            />
            {loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
                <p>Vérification...</p>
              </div>
            )}
          </div>
        )}

        {showManualInput && !concentrateur && (
          <div className={styles.manualInput}>
            <h2>Saisie manuelle</h2>
            <input
              type="text"
              className={styles.input}
              placeholder="Entrez le N° de série"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <button
              className={styles.searchButton}
              onClick={handleManualSearch}
              disabled={loading || !manualSerial.trim()}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
            <button
              className={styles.backButton}
              onClick={() => setShowManualInput(false)}
            >
              Retour au scan
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={handleReset}>
              Réessayer
            </button>
          </div>
        )}

        {concentrateur && (
          <div className={styles.result}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Package size={24} />
                <span className={styles.serial}>{concentrateur.numero_serie}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <span className={styles.label}>Modèle</span>
                  <span className={styles.value}>{concentrateur.modele || '-'}</span>
                </div>
                <div className={styles.info}>
                  <span className={styles.label}>État</span>
                  <span className={`${styles.badge} ${styles[concentrateur.etat]}`}>
                    {etatLabels[concentrateur.etat] || concentrateur.etat}
                  </span>
                </div>
                <div className={styles.info}>
                  <span className={styles.label}>Opérateur</span>
                  <span className={styles.value}>{concentrateur.operateur}</span>
                </div>
                <div className={styles.info}>
                  <MapPin size={16} />
                  <span className={styles.value}>{concentrateur.affectation || '-'}</span>
                </div>
                <div className={styles.info}>
                  <Calendar size={16} />
                  <span className={styles.value}>
                    Dernier état: {concentrateur.date_dernier_etat 
                      ? formatDate(concentrateur.date_dernier_etat) 
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.actionButton} onClick={handleCreateAction}>
                <span>Créer une action</span>
                <ArrowRight size={20} />
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Scanner un autre QR
              </button>
            </div>
          </div>
        )}

        {!showManualInput && !concentrateur && (
          <button
            className={styles.manualButton}
            onClick={() => setShowManualInput(true)}
          >
            <Keyboard size={18} />
            <span>Saisie manuelle</span>
          </button>
        )}
      </div>
    </MobileLayout>
  );
}
