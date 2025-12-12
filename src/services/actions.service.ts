import api from './api';

export type ActionType = 
  | 'livraison_magasin' 
  | 'reception_magasin' 
  | 'transfert_bo' 
  | 'pose' 
  | 'depose' 
  | 'test_labo' 
  | 'mise_au_rebut';

export interface ActionCreate {
  concentrateur_id: string;
  type_action: ActionType;
  nouvel_etat?: string;
  nouvelle_affectation?: string;
  poste_id?: number;
  commentaire?: string;
  photo?: string;
  scan_qr?: boolean;
}

export interface ActionResponse {
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
  concentrateur_id?: string;
  carton_id?: string;
  poste_id?: number;
}

export interface ActionListResponse {
  data: ActionResponse[];
  total: number;
  page: number;
  total_pages: number;
}

export const actionsService = {
  async createAction(data: ActionCreate): Promise<ActionResponse> {
    const response = await api.post<ActionResponse>('/actions', data);
    return response.data;
  },

  async getMyActions(page: number = 1, limit: number = 50): Promise<ActionListResponse> {
    const response = await api.get<ActionListResponse>('/actions/me', {
      params: { page, limit },
    });
    return response.data;
  },

  async getActions(params: {
    page?: number;
    limit?: number;
    concentrateur_id?: string;
    user_id?: number;
    type_action?: string;
  } = {}): Promise<ActionListResponse> {
    const response = await api.get<ActionListResponse>('/actions', { params });
    return response.data;
  },
};
