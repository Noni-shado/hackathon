import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/common';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Zap size={40} />
          </div>
          <h1 className={styles.title}>EDF Corse</h1>
          <p className={styles.subtitle}>Gestion des Concentrateurs CPL</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="votre.email@edf-corse.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
          >
            Se connecter
          </Button>
        </form>

        <div className={styles.footer}>
          <p>Hackathon EDF Corse 2025</p>
        </div>
      </div>
    </div>
  );
}
