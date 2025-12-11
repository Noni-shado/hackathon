import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RotateCcw, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import { actionsService } from '../../services/actions.service';
import type { Concentrateur } from '../../types';
import styles from './DeposeConcentrateur.module.css';

export function DeposeConcentrateur() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'scan' | 'confirm' | 'success'>('scan');
  const [numeroSerie, setNumeroSerie] = useState(searchParams.get('numero_serie') || '');
  const [concentrateur, setConcentrateur] = useState<Concentrateur | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!numeroSerie.trim()) {
      setError('Veuillez saisir le numéro de série');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await concentrateursService.verifyConcentrateur(numeroSerie.trim());
      if (!response.exists || !response.concentrateur) {
        setError(`Concentrateur "${numeroSerie}" introuvable`);
      } else if (response.concentrateur.etat !== 'pose') {
        setError(`Ce concentrateur n'est pas posé (état: ${response.concentrateur.etat})`);
      } else {
        setConcentrateur(response.concentrateur);
        setStep('confirm');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      await actionsService.createAction({
        concentrateur_id: numeroSerie.trim(),
        type_action: 'depose',
        nouvel_etat: 'en_stock',
        nouvelle_affectation: 'Labo',
        commentaire: commentaire.trim() || 'Dépose pour test',
        scan_qr: true,
      });
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la dépose';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setNumeroSerie('');
    setConcentrateur(null);
    setCommentaire('');
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <RotateCcw size={28} />
          <div>
            <h1>Dépose de concentrateur</h1>
            <p>Retirer un concentrateur défectueux</p>
          </div>
        </header>

        {step === 'scan' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <QrCode size={24} />
              <h2>Scanner le concentrateur</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label>Numéro de série</label>
                <input
                  type="text"
                  placeholder="Ex: CPL-BOU-20241211-ABC123"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  autoFocus
                />
              </div>
              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <Button variant="primary" onClick={handleScan} disabled={loading || !numeroSerie.trim()}>
                {loading ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Vérification...
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && concentrateur && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <RotateCcw size={24} />
              <h2>Confirmer la dépose</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Concentrateur</span>
                  <span className={styles.value}>{concentrateur.numero_serie}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Modèle</span>
                  <span className={styles.value}>{concentrateur.modele || '-'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Poste actuel</span>
                  <span className={styles.value}>{concentrateur.poste_id || '-'}</span>
                </div>
              </div>

              <div className={styles.warning}>
                <AlertTriangle size={20} />
                <div>
                  <strong>Attention</strong>
                  <p>Le concentrateur sera envoyé au Labo pour test. Cette action est irréversible.</p>
                </div>
              </div>

              <div className={styles.field}>
                <label>Raison de la dépose</label>
                <textarea
                  placeholder="Décrivez le problème observé..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
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
                  Annuler
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Dépose en cours...
                    </>
                  ) : (
                    'Confirmer la dépose'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Dépose validée !</h2>
            <p>Le concentrateur a été envoyé au Labo pour test</p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Concentrateur</span>
                <span className={styles.value}>{numeroSerie}</span>
              </div>
              <div>
                <span className={styles.label}>Nouvelle affectation</span>
                <span className={styles.value}>Labo</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle dépose
              </Button>
              <Button variant="primary" onClick={() => navigate('/bo/stock')}>
                Voir le stock
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
