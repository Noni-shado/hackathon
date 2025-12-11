import { Package, MapPin, Clock } from 'lucide-react';
import type { Concentrateur } from '../../types';
import styles from './ConcentrateursTable.module.css';

interface ConcentrateursTableProps {
  concentrateurs: Concentrateur[];
  loading: boolean;
  onRowClick: (numeroSerie: string) => void;
}

const statutLabels: Record<string, string> = {
  stock: 'En stock',
  pose: 'En pose',
  retour_constructeur: 'Retour',
  destruction: 'Destruction',
};

const statutColors: Record<string, string> = {
  stock: 'yellow',
  pose: 'green',
  retour_constructeur: 'red',
  destruction: 'gray',
};

export function ConcentrateursTable({ concentrateurs, loading, onRowClick }: ConcentrateursTableProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Série</th>
              <th>Modèle</th>
              <th>Statut</th>
              <th>Base</th>
              <th>Dernière action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className={styles.skeletonRow}>
                <td><div className={styles.skeleton} /></td>
                <td><div className={styles.skeleton} /></td>
                <td><div className={styles.skeletonBadge} /></td>
                <td><div className={styles.skeleton} /></td>
                <td><div className={styles.skeleton} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (concentrateurs.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={48} />
        <h3>Aucun concentrateur trouvé</h3>
        <p>Modifiez vos critères de recherche ou filtres</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Série</th>
              <th>Modèle</th>
              <th>Statut</th>
              <th>Base</th>
              <th>Dernière action</th>
            </tr>
          </thead>
          <tbody>
            {concentrateurs.map((c) => (
              <tr
                key={c.id}
                className={styles.row}
                onClick={() => onRowClick(c.numero_serie)}
              >
                <td className={styles.serial}>{c.numero_serie}</td>
                <td>{c.modele}</td>
                <td>
                  <span className={`${styles.badge} ${styles[statutColors[c.statut] || 'gray']}`}>
                    {statutLabels[c.statut] || c.statut}
                  </span>
                </td>
                <td>{c.base_operationnelle}</td>
                <td className={styles.date}>
                  {c.date_derniere_action ? formatDate(c.date_derniere_action) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={styles.cards}>
        {concentrateurs.map((c) => (
          <div
            key={c.id}
            className={styles.card}
            onClick={() => onRowClick(c.numero_serie)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardSerial}>{c.numero_serie}</span>
              <span className={`${styles.badge} ${styles[statutColors[c.statut] || 'gray']}`}>
                {statutLabels[c.statut] || c.statut}
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <Package size={14} />
                <span>{c.modele}</span>
              </div>
              <div className={styles.cardInfo}>
                <MapPin size={14} />
                <span>{c.base_operationnelle}</span>
              </div>
              <div className={styles.cardInfo}>
                <Clock size={14} />
                <span>{c.date_derniere_action ? formatDate(c.date_derniere_action) : '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
