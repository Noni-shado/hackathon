import { Loader2 } from 'lucide-react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const content = (
    <div className={styles.loading}>
      <Loader2 size={sizeMap[size]} className={styles.spinner} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return <div className={styles.fullScreen}>{content}</div>;
  }

  return content;
}
