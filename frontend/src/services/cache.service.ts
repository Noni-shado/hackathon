// Service de cache pour les requêtes API
// Permet d'éviter les requêtes répétées et d'améliorer la navigation

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live en millisecondes
  maxEntries: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes par défaut
  maxEntries: 100,
};

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Génère une clé de cache unique basée sur l'URL et les paramètres
   */
  generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * Récupère une entrée du cache si elle existe et n'est pas expirée
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Nettoyer le cache si on atteint la limite
    if (this.cache.size >= this.config.maxEntries) {
      this.cleanup();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.config.defaultTTL),
    };

    this.cache.set(key, entry);
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalide toutes les entrées qui correspondent à un pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalide toutes les entrées liées à une ressource
   */
  invalidateResource(resource: string): void {
    this.invalidatePattern(`^${resource}`);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées et les plus anciennes si nécessaire
   */
  private cleanup(): void {
    const now = Date.now();
    const entries: [string, CacheEntry<any>][] = [];

    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      } else {
        entries.push([key, entry]);
      }
    }

    // Si toujours trop d'entrées, supprimer les plus anciennes
    if (entries.length >= this.config.maxEntries) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(entries.length / 2));
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
    };
  }
}

// Instance singleton du cache
export const cacheService = new CacheService();

// TTL prédéfinis pour différents types de données
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 secondes - données qui changent souvent
  MEDIUM: 2 * 60 * 1000, // 2 minutes - données standard
  LONG: 5 * 60 * 1000,   // 5 minutes - données qui changent peu
  STATIC: 30 * 60 * 1000, // 30 minutes - données quasi-statiques (listes, options)
};

// Ressources pour l'invalidation
export const CACHE_RESOURCES = {
  CONCENTRATEURS: '/concentrateurs',
  MAGASIN: '/magasin',
  BO: '/bo',
  LABO: '/labo',
  DASHBOARD: '/dashboard',
};
