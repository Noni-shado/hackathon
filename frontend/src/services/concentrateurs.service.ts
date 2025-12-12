import api from './api';
import { cacheService, CACHE_TTL, CACHE_RESOURCES } from './cache.service';
import type { Concentrateur, ConcentrateurEtat } from '../types';

export interface ConcentrateurListResponse {
  data: Concentrateur[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface HistoriqueAction {
  id_action: number;
  type_action: string;
  date_action: string;
  ancien_etat?: string;
  nouvel_etat?: string;
  ancienne_affectation?: string;
  nouvelle_affectation?: string;
  commentaire?: string;
  scan_qr: boolean;
  photo?: string;
  user_id: number;
}

export interface ConcentrateurDetailResponse {
  concentrateur: Concentrateur;
  historique: HistoriqueAction[];
}

export interface ConcentrateurVerifyResponse {
  exists: boolean;
  concentrateur: Concentrateur | null;
}

export interface GetConcentrateursParams {
  page?: number;
  limit?: number;
  search?: string;
  etat?: ConcentrateurEtat;
  affectation?: string;
  operateur?: string;
}

export const concentrateursService = {
  async getConcentrateurs(params: GetConcentrateursParams = {}): Promise<ConcentrateurListResponse> {
    const { page = 1, limit = 50, search, etat, affectation, operateur } = params;
    
    // Générer la clé de cache
    const cacheKey = cacheService.generateKey(CACHE_RESOURCES.CONCENTRATEURS, params);
    
    // Vérifier le cache
    const cached = cacheService.get<ConcentrateurListResponse>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const response = await api.get<ConcentrateurListResponse>('/concentrateurs', {
      params: {
        page,
        limit,
        search: search || undefined,
        etat: etat || undefined,
        affectation: affectation || undefined,
        operateur: operateur || undefined,
      },
    });
    
    // Stocker dans le cache (2 minutes)
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    
    return response.data;
  },

  async getConcentrateur(numeroSerie: string): Promise<ConcentrateurDetailResponse> {
    const cacheKey = `${CACHE_RESOURCES.CONCENTRATEURS}/${numeroSerie}`;
    
    // Vérifier le cache
    const cached = cacheService.get<ConcentrateurDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const response = await api.get<ConcentrateurDetailResponse>(`/concentrateurs/${numeroSerie}`);
    
    // Stocker dans le cache (5 minutes pour les détails)
    cacheService.set(cacheKey, response.data, CACHE_TTL.LONG);
    
    return response.data;
  },

  async verifyConcentrateur(numeroSerie: string): Promise<ConcentrateurVerifyResponse> {
    // Pas de cache pour la vérification (doit être temps réel)
    const response = await api.get<ConcentrateurVerifyResponse>(`/concentrateurs/verify/${numeroSerie}`);
    return response.data;
  },
  
  // Invalider le cache des concentrateurs (après une action)
  invalidateCache(): void {
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
  },
};
