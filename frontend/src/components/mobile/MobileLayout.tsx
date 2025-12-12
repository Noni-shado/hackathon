import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, List, User } from 'lucide-react';
import styles from './MobileLayout.module.css';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

const navItems = [
  { path: '/mobile/scan', label: 'Scan', icon: QrCode },
  { path: '/mobile/actions', label: 'Mes actions', icon: List },
  { path: '/mobile/profil', label: 'Profil', icon: User },
];

export function MobileLayout({ children, title, showNav = true }: MobileLayoutProps) {
  const location = useLocation();

  return (
    <div className={styles.layout}>
      {title && (
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
        </header>
      )}

      <main className={styles.main}>
        {children}
      </main>

      {showNav && (
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
