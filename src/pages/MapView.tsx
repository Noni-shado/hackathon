import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ConcentrateursMap, MapLegend } from '../components/map';
import { concentrateursService } from '../services/concentrateurs.service';
import type { Concentrateur } from '../types';
import styles from './MapView.module.css';

export function MapView() {
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConcentrateurs = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all concentrateurs (increase limit for map view)
        const response = await concentrateursService.getConcentrateurs({
          limit: 1000,
        });
        setConcentrateurs(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des concentrateurs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConcentrateurs();
  }, []);

  const concentrateursWithGPS = concentrateurs.filter(
    (c) => c.localisation_gps_lat && c.localisation_gps_lng
  );

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Carte des concentrateurs</h1>
          <p className={styles.subtitle}>
            {concentrateursWithGPS.length} concentrateur{concentrateursWithGPS.length > 1 ? 's' : ''} localisé{concentrateursWithGPS.length > 1 ? 's' : ''}
          </p>
        </header>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.mapContainer}>
          <ConcentrateursMap 
            concentrateurs={concentrateurs} 
            loading={loading} 
          />
          <MapLegend />
        </div>
      </div>
    </DashboardLayout>
  );
}
