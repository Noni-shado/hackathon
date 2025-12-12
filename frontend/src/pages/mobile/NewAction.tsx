import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { MobileLayout, ActionForm } from '../../components/mobile';
import { actionsService, ActionCreate } from '../../services/actions.service';
import styles from './NewAction.module.css';

export function NewAction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialNumeroSerie = searchParams.get('numero_serie') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ActionCreate) => {
    setLoading(true);
    setError(null);

    try {
      await actionsService.createAction(data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/mobile/actions');
      }, 2000);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la création';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <MobileLayout showNav={false}>
        <div className={styles.success}>
          <CheckCircle size={64} />
          <h2>Action créée !</h2>
          <p>Redirection en cours...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
          <h1>Nouvelle action</h1>
        </header>

        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <ActionForm
            initialNumeroSerie={initialNumeroSerie}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </MobileLayout>
  );
}
