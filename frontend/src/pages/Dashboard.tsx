import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Package, Truck, AlertTriangle, Activity, FlaskConical } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatsCard } from '../components/dashboard/StatsCard';
import { StockChart } from '../components/dashboard/StockChart';
import { RecentActions } from '../components/dashboard/RecentActions';
import { Button } from '../components/common';
import { statsService, StatsOverview, BaseStock, ActionRecente } from '../services/stats.service';
import styles from './Dashboard.module.css';

const REFRESH_INTERVAL = 30000; // 30 seconds

export function Dashboard() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [stocksParBase, setStocksParBase] = useState<BaseStock[]>([]);
  const [actionsRecentes, setActionsRecentes] = useState<ActionRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [overviewData, stocksData, actionsData] = await Promise.all([
        statsService.getOverview(),
        statsService.getStocksParBase(),
        statsService.getActionsRecentes(10),
      ]);
      setOverview(overviewData);
      setStocksParBase(stocksData);
      setActionsRecentes(actionsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Tableau de bord</h1>
            <p className={styles.subtitle}>
              Vue d'ensemble des concentrateurs CPL
              {lastUpdate && (
                <span className={styles.lastUpdate}>
                  Dernière mise à jour : {formatLastUpdate(lastUpdate)}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={loading}
          >
            <RefreshCw size={16} />
            Actualiser
          </Button>
        </header>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.statsGrid}>
          <StatsCard
            title="Total concentrateurs"
            value={overview?.total_concentrateurs ?? 0}
            icon={Zap}
            color="orange"
            loading={loading}
          />
          <StatsCard
            title="En livraison"
            value={overview?.en_livraison ?? 0}
            icon={Truck}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="En stock"
            value={overview?.en_stock ?? 0}
            icon={Package}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="Poses"
            value={overview?.pose ?? 0}
            icon={Activity}
            color="green"
            loading={loading}
          />
          <StatsCard
            title="A tester (Labo)"
            value={overview?.a_tester ?? 0}
            icon={FlaskConical}
            color="orange"
            loading={loading}
          />
          <StatsCard
            title="HS (Rebut)"
            value={overview?.hs ?? 0}
            icon={AlertTriangle}
            color="red"
            loading={loading}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartMain}>
            <StockChart data={stocksParBase} loading={loading} />
          </div>
          <div className={styles.chartSide}>
            <RecentActions actions={actionsRecentes} loading={loading} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
