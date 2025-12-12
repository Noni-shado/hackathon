import styles from './MapLegend.module.css';

const legendItems = [
  { color: '#10B981', label: 'En pose' },
  { color: '#F59E0B', label: 'En stock' },
  { color: '#EF4444', label: 'Retour constructeur' },
  { color: '#6B7280', label: 'Destruction' },
];

export function MapLegend() {
  return (
    <div className={styles.legend}>
      <h4 className={styles.title}>Légende</h4>
      <ul className={styles.list}>
        {legendItems.map((item) => (
          <li key={item.label} className={styles.item}>
            <span 
              className={styles.marker} 
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
