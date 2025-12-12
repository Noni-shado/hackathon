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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonBar} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Trier par total décroissant
  const sortedData = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Stocks par base opérationnelle</h3>
      
      {/* En-tête du tableau */}
      <div className={styles.tableHeader}>
        <span className={styles.headerBase}>Base</span>
        <span className={styles.headerValue}>En stock</span>
        <span className={styles.headerValue}>Poses</span>
        <span className={styles.headerValue}>A tester</span>
        <span className={styles.headerValue}>HS</span>
        <span className={styles.headerTotal}>Total</span>
      </div>
      
      <div className={styles.chart}>
        {sortedData.map((item) => (
          <div key={item.base_operationnelle} className={styles.row}>
            <span className={styles.baseName}>{item.base_operationnelle}</span>
            <span className={`${styles.value} ${styles.valueStock}`}>
              {(item.en_stock ?? 0).toLocaleString('fr-FR')}
            </span>
            <span className={`${styles.value} ${styles.valuePose}`}>
              {(item.pose ?? 0).toLocaleString('fr-FR')}
            </span>
            <span className={`${styles.value} ${styles.valueATester}`}>
              {(item.a_tester ?? 0).toLocaleString('fr-FR')}
            </span>
            <span className={`${styles.value} ${styles.valueHS}`}>
              {(item.hs ?? 0).toLocaleString('fr-FR')}
            </span>
            <span className={styles.total}>
              {(item.total ?? 0).toLocaleString('fr-FR')}
              <span className={styles.percentage}>({(item.percentage ?? 0).toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
      
      {/* Ligne de total */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total general</span>
        <span className={`${styles.totalValue} ${styles.valueStock}`}>
          {sortedData.reduce((sum, item) => sum + (item.en_stock ?? 0), 0).toLocaleString('fr-FR')}
        </span>
        <span className={`${styles.totalValue} ${styles.valuePose}`}>
          {sortedData.reduce((sum, item) => sum + (item.pose ?? 0), 0).toLocaleString('fr-FR')}
        </span>
        <span className={`${styles.totalValue} ${styles.valueATester}`}>
          {sortedData.reduce((sum, item) => sum + (item.a_tester ?? 0), 0).toLocaleString('fr-FR')}
        </span>
        <span className={`${styles.totalValue} ${styles.valueHS}`}>
          {sortedData.reduce((sum, item) => sum + (item.hs ?? 0), 0).toLocaleString('fr-FR')}
        </span>
        <span className={styles.grandTotal}>
          {sortedData.reduce((sum, item) => sum + (item.total ?? 0), 0).toLocaleString('fr-FR')}
        </span>
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendStock}`} />
          <span>En stock</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendPose}`} />
          <span>Poses</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendATester}`} />
          <span>A tester</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.legendHS}`} />
          <span>HS</span>
        </div>
      </div>
    </div>
  );
}
