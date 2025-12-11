import api from './api';

export interface StatsOverview {
  total_concentrateurs: number;
  en_livraison: number;
  en_stock: number;
  en_stock_magasin: number;
  en_stock_bo: number;
  pose: number;
  retour_constructeur: number;
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
  retour_constructeur: number;
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
    const response = await api.get<StatsOverview>('/stats/overview');
    return response.data;
  },

  async getStocksParBase(): Promise<BaseStock[]> {
    const response = await api.get<BaseStock[]>('/stats/stocks-par-base');
    return response.data;
  },

  async getActionsRecentes(limit: number = 10): Promise<ActionRecente[]> {
    const response = await api.get<ActionRecente[]>('/stats/actions-recentes', {
      params: { limit },
    });
    return response.data;
  },

  async getParOperateur(): Promise<OperateurStats[]> {
    const response = await api.get<OperateurStats[]>('/stats/par-operateur');
    return response.data;
  },
};
