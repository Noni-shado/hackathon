import api from './api';
import { cacheService, CACHE_TTL, CACHE_RESOURCES } from './cache.service';

// ============================================
// INTERFACES
// ============================================

export interface CartonInfo {
  found: boolean;
  numero_carton: string;
  operateur?: string;
  date_reception?: string;
  nombre_concentrateurs?: number;
  concentrateurs_enregistres?: number;
  statut?: string;
  message?: string;
}

export interface ConcentrateurCheck {
  exists: boolean;
  numero_serie: string;
  operateur?: string;
  etat?: string;
  affectation?: string;
  numero_carton?: string;
}

export interface ConcentrateurCreate {
  numero_serie: string;
  modele?: string;
  operateur: string;
  numero_carton: string;
}

export interface ReceptionRequest {
  numero_carton: string;
  operateur: string;
  concentrateurs: ConcentrateurCreate[];
}

export interface ReceptionResult {
  message: string;
  carton: string;
  operateur: string;
  created: number;
  concentrateurs: string[];
  errors?: string[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface MagasinStats {
  total: number;
  en_stock: number;
  en_livraison: number;
  nb_cartons: number;
}

// ============================================
// SERVICE
// ============================================

export const magasinService = {
  // Récupérer les stats du magasin
  async getStats(): Promise<MagasinStats> {
    const cacheKey = `${CACHE_RESOURCES.MAGASIN}/stats`;
    const cached = cacheService.get<MagasinStats>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<MagasinStats>('/magasin/stats');
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  },

  // Récupérer les infos d'un carton
  async getCarton(numeroCarton: string): Promise<CartonInfo> {
    const cacheKey = `${CACHE_RESOURCES.MAGASIN}/carton/${numeroCarton}`;
    const cached = cacheService.get<CartonInfo>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<CartonInfo>(`/magasin/carton/${encodeURIComponent(numeroCarton)}`);
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  },

  // Vérifier si un concentrateur existe (pas de cache - temps réel)
  async checkConcentrateur(numeroSerie: string): Promise<ConcentrateurCheck> {
    const response = await api.get<ConcentrateurCheck>(`/magasin/concentrateur/${encodeURIComponent(numeroSerie)}`);
    return response.data;
  },

  // Liste des opérateurs (cache long - quasi-statique)
  async getOperateurs(): Promise<SelectOption[]> {
    const cacheKey = `${CACHE_RESOURCES.MAGASIN}/operateurs`;
    const cached = cacheService.get<SelectOption[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<SelectOption[]>('/magasin/operateurs');
    cacheService.set(cacheKey, response.data, CACHE_TTL.STATIC);
    return response.data;
  },

  // Liste des bases opérationnelles (cache long - quasi-statique)
  async getBasesOperationnelles(): Promise<SelectOption[]> {
    const cacheKey = `${CACHE_RESOURCES.MAGASIN}/bases-operationnelles`;
    const cached = cacheService.get<SelectOption[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<SelectOption[]>('/magasin/bases-operationnelles');
    cacheService.set(cacheKey, response.data, CACHE_TTL.STATIC);
    return response.data;
  },

  // Réception complète d'un carton avec concentrateurs
  async reception(data: ReceptionRequest): Promise<ReceptionResult> {
    const response = await api.post<ReceptionResult>('/magasin/reception', data);
    cacheService.invalidateResource(CACHE_RESOURCES.MAGASIN);
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
    cacheService.invalidateResource(CACHE_RESOURCES.DASHBOARD);
    return response.data;
  },

  // Transfert vers BO
  async transfert(boDestination: string, concentrateurs: string[]): Promise<any> {
    const response = await api.post('/magasin/transfert', {
      bo_destination: boDestination,
      concentrateurs
    });
    cacheService.invalidateResource(CACHE_RESOURCES.MAGASIN);
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
    cacheService.invalidateResource(CACHE_RESOURCES.DASHBOARD);
    return response.data;
  }
};
