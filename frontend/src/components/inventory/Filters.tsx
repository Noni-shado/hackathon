import { RotateCcw } from 'lucide-react';
import type { ConcentrateurEtat } from '../../types';
import styles from './Filters.module.css';

interface FiltersProps {
  statut: ConcentrateurEtat | '';
  base: string;
  onStatutChange: (statut: ConcentrateurEtat | '') => void;
  onBaseChange: (base: string) => void;
  onReset: () => void;
}

const STATUTS: { value: ConcentrateurEtat | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en_stock', label: 'En stock' },
  { value: 'pose', label: 'Posé' },
  { value: 'en_livraison', label: 'En livraison' },
  { value: 'a_tester', label: 'À tester' },
  { value: 'hs', label: 'HS' },
];

const BASES = [
  { value: '', label: 'Toutes les bases' },
  { value: 'Magasin', label: 'Magasin' },
  { value: 'BO Centre', label: 'BO Centre' },
  { value: 'BO Sud', label: 'BO Sud' },
  { value: 'BO Nord', label: 'BO Nord' },
  { value: 'Labo', label: 'Labo' },
];

export function Filters({ statut, base, onStatutChange, onBaseChange, onReset }: FiltersProps) {
  const hasFilters = statut !== '' || base !== '';

  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={statut}
        onChange={(e) => onStatutChange(e.target.value as ConcentrateurEtat | '')}
      >
        {STATUTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={base}
        onChange={(e) => onBaseChange(e.target.value)}
      >
        {BASES.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          className={styles.resetButton}
          onClick={onReset}
        >
          <RotateCcw size={14} />
          Réinitialiser
        </button>
      )}
    </div>
  );
}
