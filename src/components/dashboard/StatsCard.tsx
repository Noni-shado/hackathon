import { LucideIcon } from 'lucide-react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'orange' | 'blue' | 'green' | 'red' | 'gray';
  loading?: boolean;
}

export function StatsCard({ title, value, icon: Icon, color, loading = false }: StatsCardProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrapper}>
        <Icon size={24} />
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {loading ? (
          <div className={styles.skeleton} />
        ) : (
          <span className={styles.value}>{formatNumber(value)}</span>
        )}
      </div>
    </div>
  );
}
