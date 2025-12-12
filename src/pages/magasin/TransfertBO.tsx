import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Plus,
  X,
  Send
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import api from '../../services/api';
import type { Concentrateur } from '../../types';
import styles from './TransfertBO.module.css';

const BOS = ['BO Nord', 'BO Sud', 'BO Centre'];

export function TransfertBO() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'scan' | 'confirm' | 'success'>('select');
  const [boDestination, setBoDestination] = useState(BOS[0]);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ transferred: number } | null>(null);

  const handleSelectBO = () => {
    setStep('scan');
  };

  const handleAddConcentrateur = async () => {
    if (!numeroSerie.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await concentrateursService.verifyConcentrateur(numeroSerie.trim());
      if (!response.exists || !response.concentrateur) {
        setError(`Concentrateur "${numeroSerie}" introuvable`);
      } else if (response.concentrateur.affectation !== 'Magasin') {
        setError(`Ce concentrateur n'est pas au Magasin (actuellement: ${response.concentrateur.affectation})`);
      } else if (concentrateurs.find(c => c.numero_serie === response.concentrateur?.numero_serie)) {
        setError('Ce concentrateur est déjà dans la liste');
      } else {
        setConcentrateurs([...concentrateurs, response.concentrateur]);
        setNumeroSerie('');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConcentrateur = (numeroSerie: string) => {
    setConcentrateurs(concentrateurs.filter(c => c.numero_serie !== numeroSerie));
  };

  const handleConfirm = () => {
    if (concentrateurs.length === 0) {
      setError('Ajoutez au moins un concentrateur');
      return;
    }
    setStep('confirm');
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/magasin/transfert', {
        bo_destination: boDestination,
        concentrateurs: concentrateurs.map(c => c.numero_serie),
      });
      setResult(response.data);
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors du transfert';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setBoDestination(BOS[0]);
    setNumeroSerie('');
    setConcentrateurs([]);
    setError(null);
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <Truck size={28} />
          <div>
            <h1>Transfert vers BO</h1>
            <p>Préparer les livraisons pour les bases opérationnelles</p>
          </div>
        </header>

        {step === 'select' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Send size={24} />
              <h2>Sélectionner la destination</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label>Base opérationnelle</label>
                <select value={boDestination} onChange={(e) => setBoDestination(e.target.value)}>
                  {BOS.map(bo => (
                    <option key={bo} value={bo}>{bo}</option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={handleSelectBO}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 'scan' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <QrCode size={24} />
              <h2>Scanner les concentrateurs</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoBox}>
                <span className={styles.label}>Destination</span>
                <span className={styles.value}>{boDestination}</span>
              </div>

              <div className={styles.scanRow}>
                <input
                  type="text"
                  placeholder="N° série du concentrateur"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConcentrateur()}
                  disabled={loading}
                />
                <Button variant="primary" onClick={handleAddConcentrateur} disabled={loading || !numeroSerie.trim()}>
                  {loading ? <Loader2 size={18} className={styles.spinning} /> : <Plus size={18} />}
                </Button>
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {concentrateurs.length > 0 && (
                <div className={styles.list}>
                  <h3>{concentrateurs.length} concentrateur(s) sélectionné(s)</h3>
                  {concentrateurs.map(c => (
                    <div key={c.numero_serie} className={styles.listItem}>
                      <div>
                        <span className={styles.serial}>{c.numero_serie}</span>
                        <span className={styles.model}>{c.modele || '-'}</span>
                      </div>
                      <button onClick={() => handleRemoveConcentrateur(c.numero_serie)}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('select')}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleConfirm} disabled={concentrateurs.length === 0}>
                  Continuer ({concentrateurs.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <CheckCircle size={24} />
              <h2>Confirmer le transfert</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Destination</span>
                  <strong>{boDestination}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Nombre de concentrateurs</span>
                  <strong>{concentrateurs.length}</strong>
                </div>
              </div>

              <div className={styles.listCompact}>
                {concentrateurs.map(c => (
                  <span key={c.numero_serie} className={styles.chip}>{c.numero_serie}</span>
                ))}
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('scan')}>
                  Modifier
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Transfert...
                    </>
                  ) : (
                    'Valider le transfert'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Transfert validé !</h2>
            <p>{result.transferred} concentrateur(s) transféré(s) vers {boDestination}</p>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouveau transfert
              </Button>
              <Button variant="primary" onClick={() => navigate('/magasin/stock')}>
                Voir le stock
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
