import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, CACHE_TTL } from '../services/cache.service';

interface UseCachedQueryOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseCachedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook pour les requêtes avec cache
 * Permet d'éviter les requêtes répétées et d'améliorer la navigation
 */
export function useCachedQuery<T>({
  key,
  fetcher,
  ttl = CACHE_TTL.MEDIUM,
  enabled = true,
  onSuccess,
  onError,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
  const [data, setData] = useState<T | null>(() => cacheService.get<T>(key));
  const [loading, setLoading] = useState(!cacheService.get<T>(key));
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (skipCache = false) => {
    // Vérifier le cache d'abord (sauf si skipCache)
    if (!skipCache) {
      const cached = cacheService.get<T>(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      if (mountedRef.current) {
        // Stocker dans le cache
        cacheService.set(key, result, ttl);
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const message = err.response?.data?.detail || err.message || 'Erreur';
        setError(message);
        setLoading(false);
        onError?.(err);
      }
    }
  }, [key, fetcher, ttl, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData(true); // Skip cache pour forcer le refresh
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cacheService.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, key]); // Refetch quand la clé change

  return { data, loading, error, refetch, invalidate };
}

/**
 * Hook simplifié pour les listes avec cache
 */
export function useCachedList<T>(
  key: string,
  fetcher: () => Promise<T[]>,
  ttl = CACHE_TTL.MEDIUM
) {
  return useCachedQuery<T[]>({
    key,
    fetcher,
    ttl,
  });
}
