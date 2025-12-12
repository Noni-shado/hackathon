import { useState, useEffect } from 'react';
import { MapPin, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { ActionCreate } from '../../services/actions.service';
import styles from './ActionForm.module.css';

interface ActionFormProps {
  initialNumeroSerie?: string;
  onSubmit: (data: ActionCreate) => Promise<void>;
  loading?: boolean;
}

const ACTION_TYPES = [
  { value: 'livraison_magasin', label: 'Livraison Magasin' },
  { value: 'reception_magasin', label: 'Réception Magasin' },
  { value: 'transfert_bo', label: 'Transfert BO' },
  { value: 'pose', label: 'Pose' },
  { value: 'depose', label: 'Dépose' },
  { value: 'test_labo', label: 'Test Labo' },
  { value: 'mise_au_rebut', label: 'Mise au rebut' },
] as const;

const AFFECTATIONS = [
  'Magasin',
  'BO Nord',
  'BO Sud',
  'BO Centre',
  'Labo',
];

export function ActionForm({ initialNumeroSerie = '', onSubmit, loading = false }: ActionFormProps) {
  const { user } = useAuth();
  
  const [numeroSerie, setNumeroSerie] = useState(initialNumeroSerie);
  const [typeAction, setTypeAction] = useState<ActionCreate['type_action']>('pose');
  const [affectation, setAffectation] = useState(user?.base_affectee || AFFECTATIONS[0]);
  const [commentaire, setCommentaire] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    setNumeroSerie(initialNumeroSerie);
  }, [initialNumeroSerie]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Géolocalisation non supportée');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
      },
      (error) => {
        setGpsError('Impossible d\'obtenir la position');
        setGpsLoading(false);
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroSerie.trim()) return;

    const data: ActionCreate = {
      concentrateur_id: numeroSerie.trim(),
      type_action: typeAction,
      nouvelle_affectation: affectation,
      commentaire: commentaire.trim() || undefined,
      photo: photoPreview || undefined,
      scan_qr: !!initialNumeroSerie,
    };

    await onSubmit(data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>N° Série *</label>
        <input
          type="text"
          className={styles.input}
          value={numeroSerie}
          onChange={(e) => setNumeroSerie(e.target.value)}
          placeholder="Ex: CPL-2024-001234"
          required
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Type d'action *</label>
        <select
          className={styles.select}
          value={typeAction}
          onChange={(e) => setTypeAction(e.target.value as ActionCreate['type_action'])}
          disabled={loading}
        >
          {ACTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Affectation *</label>
        <select
          className={styles.select}
          value={affectation}
          onChange={(e) => setAffectation(e.target.value)}
          disabled={loading}
        >
          {AFFECTATIONS.map((aff: string) => (
            <option key={aff} value={aff}>
              {aff}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Commentaire</label>
        <textarea
          className={styles.textarea}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={3}
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Photo</label>
        <div className={styles.photoContainer}>
          {photoPreview ? (
            <div className={styles.photoPreview}>
              <img src={photoPreview} alt="Preview" />
              <button
                type="button"
                className={styles.removePhoto}
                onClick={() => setPhotoPreview(null)}
              >
                ×
              </button>
            </div>
          ) : (
            <label className={styles.photoButton}>
              <Camera size={24} />
              <span>Prendre une photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                disabled={loading}
              />
            </label>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Géolocalisation</label>
        <div className={styles.gpsContainer}>
          {latitude && longitude ? (
            <div className={styles.gpsInfo}>
              <MapPin size={16} />
              <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
            </div>
          ) : (
            <button
              type="button"
              className={styles.gpsButton}
              onClick={handleGetLocation}
              disabled={gpsLoading || loading}
            >
              {gpsLoading ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <MapPin size={18} />
              )}
              <span>{gpsLoading ? 'Localisation...' : 'Obtenir ma position'}</span>
            </button>
          )}
          {gpsError && <p className={styles.gpsError}>{gpsError}</p>}
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading || !numeroSerie.trim()}
      >
        {loading ? (
          <>
            <Loader2 size={20} className={styles.spinner} />
            Création en cours...
          </>
        ) : (
          'Valider l\'action'
        )}
      </button>
    </form>
  );
}
