import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import { useAuth } from '../../hooks/useAuth';
import type { Concentrateur } from '../../types';
import styles from './StockBO.module.css';

const etatLabels: Record<string, string> = {
  en_livraison: 'En livraison',
  en_stock: 'En stock',
  pose: 'Posé',
  retour_constructeur: 'Retour',
  hs: 'HS',
};

const etatColors: Record<string, string> = {
  en_livraison: 'blue',
  en_stock: 'green',
  pose: 'orange',
  retour_constructeur: 'red',
  hs: 'gray',
};

export function StockBO() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const boName = user?.base_affectee || 'BO Nord';
  
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterEtat, setFilterEtat] = useState('');
  const [total, setTotal] = useState(0);

  const fetchConcentrateurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await concentrateursService.getConcentrateurs({
        affectation: boName,
        search: search || undefined,
        etat: filterEtat as any || undefined,
        limit: 100,
      });
      setConcentrateurs(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [boName, search, filterEtat]);

  useEffect(() => {
    fetchConcentrateurs();
  }, [fetchConcentrateurs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const stats = {
    total: concentrateurs.length,
    enStock: concentrateurs.filter(c => c.etat === 'en_stock').length,
    poses: concentrateurs.filter(c => c.etat === 'pose').length,
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Package size={28} />
            <div>
              <h1>Stock {boName}</h1>
              <p>Concentrateurs affectés à votre base</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" onClick={fetchConcentrateurs} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/bo/pose')}>
              <Zap size={16} />
              Poser
            </Button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total affectés</span>
          </div>
          <div className={`${styles.statCard} ${styles.green}`}>
            <span className={styles.statValue}>{stats.enStock}</span>
            <span className={styles.statLabel}>En stock</span>
          </div>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <span className={styles.statValue}>{stats.poses}</span>
            <span className={styles.statLabel}>Posés</span>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Rechercher par N° série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}>
              <option value="">Tous états</option>
              <option value="en_stock">En stock</option>
              <option value="pose">Posé</option>
            </select>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Série</th>
                <th>Modèle</th>
                <th>État</th>
                <th>Poste</th>
                <th>Date pose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loading}>Chargement...</td>
                </tr>
              ) : concentrateurs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Aucun concentrateur</td>
                </tr>
              ) : (
                concentrateurs.map((c) => (
                  <tr key={c.numero_serie}>
                    <td className={styles.serial}>{c.numero_serie}</td>
                    <td>{c.modele || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[etatColors[c.etat] || 'gray']}`}>
                        {etatLabels[c.etat] || c.etat}
                      </span>
                    </td>
                    <td>{c.poste_id || '-'}</td>
                    <td>{formatDate(c.date_pose)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/concentrateur/${c.numero_serie}`)}
                        >
                          Détail
                        </Button>
                        {c.etat === 'pose' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/bo/depose?numero_serie=${c.numero_serie}`)}
                          >
                            Déposer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <span>{total} concentrateur(s) au total</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
