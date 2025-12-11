export interface User {
  id_utilisateur: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'gestionnaire' | 'agent_terrain';
  base_affectee: string;
  telephone?: string;
  actif: boolean;
  date_inscription?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
}

export type ConcentrateurEtat = 'en_livraison' | 'en_stock' | 'pose' | 'retour_constructeur' | 'hs';

export interface Concentrateur {
  numero_serie: string;
  modele?: string;
  operateur: string;
  etat: ConcentrateurEtat;
  affectation?: string;
  hs: boolean;
  date_affectation?: string;
  date_pose?: string;
  date_dernier_etat?: string;
  commentaire?: string;
  photo?: string;
  numero_carton?: string;
  poste_id?: number;
}

export interface PosteElectrique {
  id_poste: number;
  code_poste: string;
  nom_poste?: string;
  localisation?: string;
  bo_affectee?: string;
  latitude?: number;
  longitude?: number;
}

export interface Carton {
  numero_carton: string;
  operateur: string;
  date_reception?: string;
  nombre_concentrateurs: number;
  statut: string;
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
  concentrateur_id?: string;
  carton_id?: string;
  poste_id?: number;
}
