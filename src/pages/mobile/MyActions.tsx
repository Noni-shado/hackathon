import { useState, useEffect } from 'react';
import { RefreshCw, Package, MapPin } from 'lucide-react';
import { MobileLayout } from '../../components/mobile';
import { actionsService, ActionResponse } from '../../services/actions.service';
import styles from './MyActions.module.css';

const actionTypeLabels: Record<string, string> = {
  livraison_magasin: 'Livraison',
  reception_magasin: 'Réception',
  transfert_bo: 'Transfert',
  pose: 'Pose',
  depose: 'Dépose',
  test_labo: 'Test Labo',
  mise_au_rebut: 'Rebut',
};

const actionTypeColors: Record<string, string> = {
  livraison_magasin: 'blue',
  reception_magasin: 'blue',
  transfert_bo: 'orange',
  pose: 'green',
  depose: 'gray',
  test_labo: 'yellow',
  mise_au_rebut: 'red',
};

export function MyActions() {
  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await actionsService.getMyActions(1, 50);
      setActions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MobileLayout title="Mes actions">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.count}>
            {actions.length} action{actions.length > 1 ? 's' : ''}
          </span>
          <button
            className={styles.refreshButton}
            onClick={fetchActions}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? styles.spinning : ''} />
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {loading && actions.length === 0 ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Chargement...</p>
          </div>
        ) : actions.length === 0 ? (
          <div className={styles.empty}>
            <Package size={48} />
            <p>Aucune action enregistrée</p>
          </div>
        ) : (
          <div className={styles.list}>
            {actions.map((action) => (
              <div key={action.id_action} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={`${styles.badge} ${styles[actionTypeColors[action.type_action] || 'gray']}`}>
                    {actionTypeLabels[action.type_action] || action.type_action}
                  </span>
                  <span className={styles.date}>
                    {formatDateTime(action.date_action)}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  {action.concentrateur_id && (
                    <div className={styles.info}>
                      <Package size={16} />
                      <span className={styles.serial}>
                        {action.concentrateur_id}
                      </span>
                    </div>
                  )}
                  {action.nouvelle_affectation && (
                    <div className={styles.info}>
                      <MapPin size={16} />
                      <span>{action.ancienne_affectation} → {action.nouvelle_affectation}</span>
                    </div>
                  )}
                  {action.nouvel_etat && (
                    <div className={styles.info}>
                      <span className={styles.etat}>{action.ancien_etat} → {action.nouvel_etat}</span>
                    </div>
                  )}
                  {action.commentaire && (
                    <p className={styles.comment}>{action.commentaire}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
