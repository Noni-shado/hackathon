import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  MapPin
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import { actionsService } from '../../services/actions.service';
import { useAuth } from '../../hooks/useAuth';
import type { Concentrateur } from '../../types';
import styles from './PoseConcentrateur.module.css';

export function PoseConcentrateur() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const boName = user?.base_affectee || 'BO Nord';
  
  const [step, setStep] = useState<'scan' | 'details' | 'success'>('scan');
  const [numeroSerie, setNumeroSerie] = useState(searchParams.get('numero_serie') || '');
  const [concentrateur, setConcentrateur] = useState<Concentrateur | null>(null);
  const [posteId, setPosteId] = useState('');
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
      } else if (response.concentrateur.etat !== 'en_stock') {
        setError(`Ce concentrateur n'est pas en stock (état: ${response.concentrateur.etat})`);
      } else if (response.concentrateur.affectation !== boName) {
        setError(`Ce concentrateur n'est pas affecté à ${boName} (affectation: ${response.concentrateur.affectation})`);
      } else {
        setConcentrateur(response.concentrateur);
        setStep('details');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!posteId.trim()) {
      setError('Veuillez saisir le code du poste');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await actionsService.createAction({
        concentrateur_id: numeroSerie.trim(),
        type_action: 'pose',
        nouvel_etat: 'pose',
        nouvelle_affectation: boName,
        commentaire: commentaire.trim() || undefined,
        scan_qr: true,
      });
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la pose';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setNumeroSerie('');
    setConcentrateur(null);
    setPosteId('');
    setCommentaire('');
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <Zap size={28} />
          <div>
            <h1>Pose de concentrateur</h1>
            <p>Installer un concentrateur sur un poste</p>
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

        {step === 'details' && concentrateur && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin size={24} />
              <h2>Informations de pose</h2>
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
                  <span className={styles.label}>Opérateur</span>
                  <span className={styles.value}>{concentrateur.operateur}</span>
                </div>
              </div>

              <div className={styles.field}>
                <label>Code du poste *</label>
                <input
                  type="text"
                  placeholder="Ex: POSTE-001"
                  value={posteId}
                  onChange={(e) => setPosteId(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Commentaire</label>
                <textarea
                  placeholder="Observations..."
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
                  Retour
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={loading || !posteId.trim()}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Pose en cours...
                    </>
                  ) : (
                    'Valider la pose'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Pose validée !</h2>
            <p>Le concentrateur a été posé sur le poste {posteId}</p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Concentrateur</span>
                <span className={styles.value}>{numeroSerie}</span>
              </div>
              <div>
                <span className={styles.label}>Poste</span>
                <span className={styles.value}>{posteId}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle pose
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
