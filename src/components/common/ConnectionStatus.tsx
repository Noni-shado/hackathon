import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import styles from './ConnectionStatus.module.css';

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={styles.banner}>
      <WifiOff size={16} />
      <span>Vous êtes hors ligne</span>
    </div>
  );
}
