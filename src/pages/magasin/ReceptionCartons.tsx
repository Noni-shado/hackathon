import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Truck
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import api from '../../services/api';
import styles from './ReceptionCartons.module.css';

export function ReceptionCartons() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'details' | 'success'>('scan');
  const [numeroCarton, setNumeroCarton] = useState('');
  const [operateur, setOperateur] = useState('Bouygues');
  const [quantite, setQuantite] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number } | null>(null);

  const handleScanSubmit = () => {
    if (!numeroCarton.trim()) {
      setError('Veuillez saisir le numéro de carton');
      return;
    }
    setError(null);
    setStep('details');
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/magasin/reception', {
        numero_carton: numeroCarton.trim(),
        operateur,
        quantite,
      });
      setResult(response.data);
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la réception';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setNumeroCarton('');
    setOperateur('Bouygues');
    setQuantite(10);
    setError(null);
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <Truck size={28} />
          <div>
            <h1>Réception Cartons</h1>
            <p>Scanner les cartons fournisseurs</p>
          </div>
        </header>

        {step === 'scan' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <QrCode size={24} />
              <h2>Scanner le carton</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label>Numéro de carton</label>
                <input
                  type="text"
                  placeholder="Ex: CART-2024-001234"
                  value={numeroCarton}
                  onChange={(e) => setNumeroCarton(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanSubmit()}
                  autoFocus
                />
              </div>
              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <Button variant="primary" onClick={handleScanSubmit} disabled={!numeroCarton.trim()}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Package size={24} />
              <h2>Détails du carton</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoBox}>
                <span className={styles.label}>N° Carton</span>
                <span className={styles.value}>{numeroCarton}</span>
              </div>

              <div className={styles.field}>
                <label>Opérateur</label>
                <select value={operateur} onChange={(e) => setOperateur(e.target.value)}>
                  <option value="Bouygues">Bouygues</option>
                  <option value="Orange">Orange</option>
                  <option value="SFR">SFR</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Quantité de concentrateurs</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quantite}
                  onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                />
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('scan')}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Création...
                    </>
                  ) : (
                    'Valider la réception'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Réception validée !</h2>
            <p>{result.created} concentrateur(s) créé(s)</p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Carton</span>
                <span className={styles.value}>{numeroCarton}</span>
              </div>
              <div>
                <span className={styles.label}>Opérateur</span>
                <span className={styles.value}>{operateur}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle réception
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
