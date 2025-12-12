import api from './api';

export interface Commande {
  id_commande: number;
  bo_demandeur: string;
  quantite: number;
  operateur_souhaite?: string;
  statut_commande: string;
  user_id: number;
  date_commande: string;
  date_validation?: string;
  date_livraison?: string;
  demandeur_nom?: string;
  demandeur_prenom?: string;
}

export interface CommandeCreate {
  bo_demandeur: string;
  quantite: number;
  operateur_souhaite?: string;
}

export interface CartonDisponible {
  numero_carton: string;
  operateur: string;
  date_reception: string;
  concentrateurs_disponibles: number;
}

export interface ValidationResult {
  message: string;
  commande_id: number;
  carton: string;
  bo_destination: string;
  concentrateurs_transferes: number;
  numeros_serie: string[];
}

export const transfertsService = {
  async getCommandes(statut?: string): Promise<Commande[]> {
    const params = statut ? { statut } : {};
    const response = await api.get<Commande[]>('/transferts', { params });
    return response.data;
  },

  async getCommande(id: number): Promise<Commande> {
    const response = await api.get<Commande>(`/transferts/${id}`);
    return response.data;
  },

  async createCommande(data: CommandeCreate): Promise<Commande> {
    const response = await api.post<Commande>('/transferts', data);
    return response.data;
  },

  async validerTransfert(id: number, numeroCarton: string): Promise<ValidationResult> {
    const response = await api.post<ValidationResult>(`/transferts/${id}/valider`, {
      numero_carton: numeroCarton
    });
    return response.data;
  },

  async annulerCommande(id: number): Promise<{ message: string; id_commande: number }> {
    const response = await api.post<{ message: string; id_commande: number }>(`/transferts/${id}/annuler`);
    return response.data;
  },

  async getCartonsDisponibles(operateur?: string): Promise<CartonDisponible[]> {
    const params = operateur ? { operateur } : {};
    const response = await api.get<CartonDisponible[]>('/transferts/cartons/disponibles', { params });
    return response.data;
  }
};
