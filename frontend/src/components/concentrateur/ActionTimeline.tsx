import { 
  Package, 
  Truck, 
  MapPin, 
  RotateCcw, 
  Trash2, 
  ArrowRightLeft,
  User,
  Clock,
  MessageSquare,
  Edit
} from 'lucide-react';
import type { HistoriqueAction } from '../../services/concentrateurs.service';
import styles from './ActionTimeline.module.css';

interface ActionTimelineProps {
  actions: HistoriqueAction[];
  loading?: boolean;
}

const actionConfig: Record<string, { icon: typeof Package; label: string; color: string }> = {
  reception_magasin: { icon: Package, label: 'Réception', color: 'blue' },
  transfert: { icon: ArrowRightLeft, label: 'Transfert', color: 'orange' },
  pose: { icon: MapPin, label: 'Pose', color: 'green' },
  depose: { icon: RotateCcw, label: 'Dépose', color: 'gray' },
  retour_constructeur: { icon: Truck, label: 'Retour constructeur', color: 'red' },
  modification: { icon: Edit, label: 'Modification', color: 'blue' },
  destruction: { icon: Trash2, label: 'Destruction', color: 'red' },
};

export function ActionTimeline({ actions, loading = false }: ActionTimelineProps) {
  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Historique des actions</h3>
        <div className={styles.timeline}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonDot} />
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

  if (actions.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Historique des actions</h3>
        <div className={styles.empty}>
          <Clock size={32} />
          <p>Aucune action enregistrée</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Historique des actions</h3>
      <div className={styles.timeline}>
        {actions.map((action, index) => {
          const config = actionConfig[action.type_action] || actionConfig.reception_magasin;
          const Icon = config.icon;
          const { date, time } = formatDateTime(action.date_action);
          const isFirst = index === 0;

          return (
            <div key={action.id_action} className={`${styles.item} ${isFirst ? styles.itemFirst : ''}`}>
              <div className={`${styles.dot} ${styles[config.color]}`}>
                <Icon size={14} />
              </div>
              <div className={styles.content}>
                <div className={styles.header}>
                  <span className={`${styles.badge} ${styles[config.color]}`}>
                    {config.label}
                  </span>
                  <span className={styles.datetime}>
                    {date} à {time}
                  </span>
                </div>
                <div className={styles.details}>
                  <div className={styles.detail}>
                    <User size={14} />
                    <span>Agent #{action.user_id}</span>
                  </div>
                  {action.ancien_etat && action.nouvel_etat && (
                    <div className={styles.detail}>
                      <ArrowRightLeft size={14} />
                      <span>{action.ancien_etat} → {action.nouvel_etat}</span>
                    </div>
                  )}
                  {action.nouvelle_affectation && (
                    <div className={styles.detail}>
                      <MapPin size={14} />
                      <span>{action.nouvelle_affectation}</span>
                    </div>
                  )}
                </div>
                {action.commentaire && (
                  <div className={styles.comment}>
                    <MessageSquare size={14} />
                    <span>{action.commentaire}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
