import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { boService, DemandeTransfert as DemandeType } from '../../services/bo.service';
import { useAuth } from '../../hooks/useAuth';
import styles from './DemandeTransfert.module.css';

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  validee: 'Validee',
  en_livraison: 'En livraison',
  livree: 'Livree',
  annulee: 'Annulee'
};

const statutIcons: Record<string, React.ReactNode> = {
  en_attente: <Clock size={16} />,
  validee: <CheckCircle2 size={16} />,
  en_livraison: <Package size={16} />,
  livree: <CheckCircle size={16} />,
  annulee: <XCircle size={16} />
};

export function DemandeTransfert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const boName = user?.base_affectee || 'BO';
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [quantite, setQuantite] = useState<number>(4);
  const [operateur, setOperateur] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const [demandes, setDemandes] = useState<DemandeType[]>([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = async () => {
    try {
      setLoadingDemandes(true);
      const data = await boService.getDemandes();
      setDemandes(data);
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
    } finally {
      setLoadingDemandes(false);
    }
  };

  const handleSubmit = async () => {
    if (quantite <= 0) {
      setError('La quantite doit etre superieure a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await boService.creerDemande(quantite, operateur || undefined);
      setResult(res);
      setStep('success');
      loadDemandes();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la creation de la demande';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setQuantite(4);
    setOperateur('');
    setError(null);
    setResult(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <Send size={28} />
          <div>
            <h1>Demande de transfert</h1>
            <p>{boName} - Demander des concentrateurs au Magasin</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.formSection}>
            {step === 'form' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <Package size={24} />
                  <h2>Nouvelle demande</h2>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.field}>
                    <label>Nombre de cartons * (4 concentrateurs par carton)</label>
                    <div className={styles.quantiteSelector}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setQuantite(Math.max(4, quantite - 4))}
                        disabled={quantite <= 4}
                      >
                        -
                      </Button>
                      <span className={styles.quantiteValue}>
                        {quantite / 4} carton(s) = <strong>{quantite}</strong> concentrateurs
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setQuantite(quantite + 4)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Operateur souhaite (optionnel)</label>
                    <select value={operateur} onChange={(e) => setOperateur(e.target.value)}>
                      <option value="">Peu importe</option>
                      <option value="Enedis">Enedis</option>
                      <option value="EDF">EDF</option>
                    </select>
                  </div>

                  <div className={styles.infoBox}>
                    <p>Cette demande sera visible par le Magasin dans la section Transferts. Ils pourront alors preparer et expedier les concentrateurs vers votre base.</p>
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <AlertTriangle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading || quantite <= 0}>
                      {loading ? (
                        <>
                          <Loader2 size={18} className={styles.spinning} />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Envoyer la demande
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 'success' && result && (
              <div className={styles.successCard}>
                <CheckCircle size={64} />
                <h2>Demande envoyee !</h2>
                <p>{result.message}</p>
                <div className={styles.successDetails}>
                  <div>
                    <span className={styles.label}>N demande</span>
                    <span className={styles.value}>#{result.id_commande}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Quantite</span>
                    <span className={styles.value}>{result.quantite}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Statut</span>
                    <span className={styles.value}>{result.statut}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button variant="outline" onClick={handleReset}>
                    Nouvelle demande
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/bo/stock')}>
                    Voir le stock
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.historySection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Clock size={24} />
                <h2>Historique des demandes</h2>
              </div>
              <div className={styles.cardBody}>
                {loadingDemandes ? (
                  <div className={styles.loading}>
                    <Loader2 size={24} className={styles.spinning} />
                    <span>Chargement...</span>
                  </div>
                ) : demandes.length === 0 ? (
                  <div className={styles.empty}>
                    <p>Aucune demande pour le moment</p>
                  </div>
                ) : (
                  <div className={styles.demandesList}>
                    {demandes.map((d) => (
                      <div key={d.id_commande} className={styles.demandeItem}>
                        <div className={styles.demandeHeader}>
                          <span className={styles.demandeId}>#{d.id_commande}</span>
                          <span className={`${styles.demandeStatut} ${styles[d.statut]}`}>
                            {statutIcons[d.statut]}
                            {statutLabels[d.statut] || d.statut}
                          </span>
                        </div>
                        <div className={styles.demandeDetails}>
                          <span>{d.quantite} concentrateur(s)</span>
                          {d.operateur_souhaite && <span>Op: {d.operateur_souhaite}</span>}
                        </div>
                        <div className={styles.demandeDate}>
                          {formatDate(d.date_commande)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
