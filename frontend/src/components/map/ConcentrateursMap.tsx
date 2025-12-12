import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import type { Concentrateur } from '../../types';
import 'leaflet/dist/leaflet.css';
import styles from './ConcentrateursMap.module.css';

// Fix default icon issue with Leaflet + Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface ConcentrateursMapProps {
  concentrateurs: Concentrateur[];
  loading?: boolean;
}

// Corse center and bounds
const CORSE_CENTER: [number, number] = [42.0396, 9.0129];
const CORSE_BOUNDS: [[number, number], [number, number]] = [
  [41.3, 8.5],
  [43.0, 9.6],
];

// Custom marker icons by status
const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: styles.customMarker,
    html: `<div class="${styles.markerPin}" style="background-color: ${color};">
      <span class="${styles.markerDot}"></span>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

const markerIcons = {
  pose: createMarkerIcon('#10B981'),
  stock: createMarkerIcon('#F59E0B'),
  retour_constructeur: createMarkerIcon('#EF4444'),
  destruction: createMarkerIcon('#6B7280'),
};

const statutLabels: Record<string, string> = {
  stock: 'En stock',
  pose: 'En pose',
  retour_constructeur: 'Retour constructeur',
  destruction: 'Destruction',
};

function MapBounds() {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds(CORSE_BOUNDS);
    map.setMinZoom(8);
  }, [map]);
  
  return null;
}

export function ConcentrateursMap({ concentrateurs, loading = false }: ConcentrateursMapProps) {
  // Filter concentrateurs with GPS coordinates
  const mappableConcentrateurs = concentrateurs.filter(
    (c) => c.localisation_gps_lat && c.localisation_gps_lng
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={CORSE_CENTER}
      zoom={9}
      className={styles.map}
      scrollWheelZoom={true}
    >
      <MapBounds />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {mappableConcentrateurs.map((concentrateur) => {
        const lat = parseFloat(String(concentrateur.localisation_gps_lat));
        const lng = parseFloat(String(concentrateur.localisation_gps_lng));
        const icon = markerIcons[concentrateur.statut as keyof typeof markerIcons] || markerIcons.stock;
        
        return (
          <Marker
            key={concentrateur.id}
            position={[lat, lng]}
            icon={icon}
          >
            <Popup className={styles.popup}>
              <div className={styles.popupContent}>
                <h3 className={styles.popupTitle}>{concentrateur.numero_serie}</h3>
                <div className={styles.popupInfo}>
                  <p><strong>Modèle:</strong> {concentrateur.modele}</p>
                  <p><strong>Statut:</strong> {statutLabels[concentrateur.statut] || concentrateur.statut}</p>
                  <p><strong>Base:</strong> {concentrateur.base_operationnelle}</p>
                  {concentrateur.adresse_installation && (
                    <p><strong>Adresse:</strong> {concentrateur.adresse_installation}</p>
                  )}
                </div>
                <Link 
                  to={`/concentrateurs/${concentrateur.numero_serie}`}
                  className={styles.popupLink}
                >
                  Voir détails →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
