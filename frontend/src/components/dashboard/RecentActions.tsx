import { Clock, User, Package } from 'lucide-react';
import type { ActionRecente } from '../../services/stats.service';
import styles from './RecentActions.module.css';

interface RecentActionsProps {
  actions: ActionRecente[];
  loading?: boolean;
}

const actionTypeLabels: Record<string, string> = {
  reception_magasin: 'Réception',
  transfert: 'Transfert',
  pose: 'Pose',
  depose: 'Dépose',
  retour_constructeur: 'Retour',
  modification: 'Modification',
  destruction: 'Destruction',
};

const actionTypeColors: Record<string, string> = {
  reception_magasin: 'blue',
  transfert: 'orange',
  pose: 'green',
  depose: 'gray',
  retour_constructeur: 'red',
  modification: 'blue',
  destruction: 'red',
};

export function RecentActions({ actions, loading = false }: RecentActionsProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Dernières actions</h3>
        <div className={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonBadge} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Dernières actions</h3>
      <div className={styles.list}>
        {actions.length === 0 ? (
          <p className={styles.empty}>Aucune action récente</p>
        ) : (
          actions.map((action) => (
            <div key={action.id_action} className={styles.item}>
              <span className={`${styles.badge} ${styles[actionTypeColors[action.type_action] || 'gray']}`}>
                {actionTypeLabels[action.type_action] || action.type_action}
              </span>
              <div className={styles.content}>
                <div className={styles.main}>
                  <Package size={14} />
                  <span className={styles.serial}>{action.concentrateur_id || 'N/A'}</span>
                  {action.nouvel_etat && (
                    <span className={styles.model}>→ {action.nouvel_etat}</span>
                  )}
                </div>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <User size={12} />
                    {action.user ? `${action.user.prenom} ${action.user.nom}` : 'Inconnu'}
                  </span>
                  <span className={styles.metaItem}>
                    <Clock size={12} />
                    {formatDate(action.date_action)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
