import type { BaseStock } from '../../services/stats.service';
import styles from './StockChart.module.css';

interface StockChartProps {
  data: BaseStock[];
  loading?: boolean;
}

export function StockChart({ data, loading = false }: StockChartProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Stocks par base opérationnelle</h3>
        <div className={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonBar} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Stocks par base opérationnelle</h3>
      <div className={styles.chart}>
        {data.map((item) => (
          <div key={item.base_operationnelle} className={styles.row}>
            <div className={styles.label}>
              <span className={styles.baseName}>{item.base_operationnelle}</span>
              <span className={styles.total}>{item.total}</span>
            </div>
            <div className={styles.barContainer}>
              <div className={styles.barBackground}>
                <div
                  className={styles.barStock}
                  style={{ width: `${(item.en_stock / maxTotal) * 100}%` }}
                  title={`En stock: ${item.en_stock}`}
                />
                <div
                  className={styles.barPose}
                  style={{ width: `${(item.pose / maxTotal) * 100}%` }}
                  title={`En pose: ${item.pose}`}
                />
                <div
                  className={styles.barRetour}
                  style={{ width: `${(item.retour_constructeur / maxTotal) * 100}%` }}
                  title={`Retour: ${item.retour_constructeur}`}
                />
              </div>
              <span className={styles.percentage}>{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendStock}`} />
          <span>En stock</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendPose}`} />
          <span>En pose</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendRetour}`} />
          <span>Retour</span>
        </div>
      </div>
    </div>
  );
}
