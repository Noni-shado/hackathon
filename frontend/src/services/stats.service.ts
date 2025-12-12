import api from './api';
import { cacheService, CACHE_TTL, CACHE_RESOURCES } from './cache.service';

export interface StatsOverview {
  total_concentrateurs: number;
  en_livraison: number;
  en_stock: number;
  en_stock_magasin: number;
  en_stock_bo: number;
  pose: number;
  a_tester: number;
  hs: number;
  actions_today: number;
  total_postes: number;
  total_cartons: number;
  total_utilisateurs: number;
}

export interface BaseStock {
  base_operationnelle: string;
  total: number;
  en_livraison: number;
  en_stock: number;
  pose: number;
  a_tester: number;
  hs: number;
  percentage: number;
}

export interface ActionRecente {
  id_action: number;
  type_action: string;
  date_action: string;
  ancien_etat?: string;
  nouvel_etat?: string;
  ancienne_affectation?: string;
  nouvelle_affectation?: string;
  commentaire?: string;
  concentrateur_id?: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    role: string;
  };
}

export interface OperateurStats {
  operateur: string;
  total: number;
  en_stock: number;
  pose: number;
  hs: number;
}

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    const cacheKey = `${CACHE_RESOURCES.DASHBOARD}/overview`;
    const cached = cacheService.get<StatsOverview>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<StatsOverview>('/stats/overview');
    cacheService.set(cacheKey, response.data, CACHE_TTL.SHORT); // Court car données temps réel
    return response.data;
  },

  async getStocksParBase(): Promise<BaseStock[]> {
    const cacheKey = `${CACHE_RESOURCES.DASHBOARD}/stocks-par-base`;
    const cached = cacheService.get<BaseStock[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<BaseStock[]>('/stats/stocks-par-base');
    cacheService.set(cacheKey, response.data, CACHE_TTL.SHORT);
    return response.data;
  },

  async getActionsRecentes(limit: number = 10): Promise<ActionRecente[]> {
    const cacheKey = `${CACHE_RESOURCES.DASHBOARD}/actions-recentes/${limit}`;
    const cached = cacheService.get<ActionRecente[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<ActionRecente[]>('/stats/actions-recentes', {
      params: { limit },
    });
    cacheService.set(cacheKey, response.data, CACHE_TTL.SHORT);
    return response.data;
  },

  async getParOperateur(): Promise<OperateurStats[]> {
    const cacheKey = `${CACHE_RESOURCES.DASHBOARD}/par-operateur`;
    const cached = cacheService.get<OperateurStats[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<OperateurStats[]>('/stats/par-operateur');
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  }
};
