import { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { actionsService, ActionResponse } from '../services/actions.service';
import styles from './Actions.module.css';

const actionTypeLabels: Record<string, string> = {
  reception: 'Réception',
  transfert: 'Transfert',
  pose: 'Pose',
  depose: 'Dépose',
  retour_constructeur: 'Retour constructeur',
  destruction: 'Destruction',
};

const actionTypeColors: Record<string, string> = {
  reception: 'blue',
  transfert: 'orange',
  pose: 'green',
  depose: 'gray',
  retour_constructeur: 'red',
  destruction: 'red',
};

export function Actions() {
  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await actionsService.getMyActions(1, 100);
      setActions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des actions');
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
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Mes Actions</h1>
              <p className={styles.subtitle}>
                {actions.length} action{actions.length > 1 ? 's' : ''} enregistrée{actions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            className={styles.refreshButton}
            onClick={fetchActions}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? styles.spinning : ''} />
            Actualiser
          </button>
        </header>

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
            <ClipboardList size={48} />
            <p>Aucune action enregistrée</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {actions.map((action) => (
              <div key={action.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.actionType}>
                    <span className={`${styles.badge} ${styles[actionTypeColors[action.type_action] || 'gray']}`}>
                      {actionTypeLabels[action.type_action] || action.type_action}
                    </span>
                    <span className={styles.date}>{formatDateTime(action.date_action)}</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Concentrateur:</span>
                    {action.concentrateur ? (
                      <span className={styles.value}>
                        <strong>{action.concentrateur.numero_serie}</strong> ({action.concentrateur.modele})
                      </span>
                    ) : (
                      <span className={styles.value}>-</span>
                    )}
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Base:</span>
                    <span className={styles.value}>{action.base_operationnelle}</span>
                  </div>
                  
                  {action.commentaire && (
                    <div className={styles.commentSection}>
                      <span className={styles.label}>Commentaire:</span>
                      <p className={styles.commentText}>{action.commentaire}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
