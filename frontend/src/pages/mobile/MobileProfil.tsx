import { useNavigate } from 'react-router-dom';
import { User, MapPin, Mail, LogOut, Monitor } from 'lucide-react';
import { MobileLayout } from '../../components/mobile';
import { useAuth } from '../../hooks/useAuth';
import styles from './MobileProfil.module.css';

export function MobileProfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDesktopMode = () => {
    navigate('/dashboard');
  };

  return (
    <MobileLayout title="Profil">
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.avatar}>
            <User size={32} />
          </div>
          <h2 className={styles.name}>{user?.prenom} {user?.nom}</h2>
          <span className={styles.role}>{user?.role}</span>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <Mail size={18} />
            <div>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user?.email}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <MapPin size={18} />
            <div>
              <span className={styles.label}>Base opérationnelle</span>
              <span className={styles.value}>{user?.base_operationnelle}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.desktopButton} onClick={handleDesktopMode}>
            <Monitor size={18} />
            <span>Mode bureau</span>
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
