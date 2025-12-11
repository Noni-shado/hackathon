import { RotateCcw } from 'lucide-react';
import type { ConcentrateurStatut } from '../../types';
import styles from './Filters.module.css';

interface FiltersProps {
  statut: ConcentrateurStatut | '';
  base: string;
  onStatutChange: (statut: ConcentrateurStatut | '') => void;
  onBaseChange: (base: string) => void;
  onReset: () => void;
}

const STATUTS: { value: ConcentrateurStatut | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'stock', label: 'En stock' },
  { value: 'pose', label: 'En pose' },
  { value: 'retour_constructeur', label: 'Retour constructeur' },
  { value: 'destruction', label: 'Destruction' },
];

const BASES = [
  { value: '', label: 'Toutes les bases' },
  { value: 'Ajaccio', label: 'Ajaccio' },
  { value: 'Bastia', label: 'Bastia' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Porto-Vecchio', label: 'Porto-Vecchio' },
  { value: 'Calvi', label: 'Calvi' },
  { value: 'Sartène', label: 'Sartène' },
];

export function Filters({ statut, base, onStatutChange, onBaseChange, onReset }: FiltersProps) {
  const hasFilters = statut !== '' || base !== '';

  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={statut}
        onChange={(e) => onStatutChange(e.target.value as ConcentrateurStatut | '')}
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
