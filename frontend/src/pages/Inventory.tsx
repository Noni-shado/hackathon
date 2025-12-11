import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SearchBar, Filters, ConcentrateursTable, Pagination } from '../components/inventory';
import { concentrateursService, ConcentrateurListResponse } from '../services/concentrateurs.service';
import { useDebounce } from '../hooks/useDebounce';
import type { Concentrateur, ConcentrateurStatut } from '../types';
import styles from './Inventory.module.css';

const ITEMS_PER_PAGE = 20;

export function Inventory() {
  const navigate = useNavigate();
  
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<ConcentrateurStatut | ''>('');
  const [base, setBase] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const fetchConcentrateurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ConcentrateurListResponse = await concentrateursService.getConcentrateurs({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        statut: statut || undefined,
        base: base || undefined,
      });
      
      setConcentrateurs(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError('Erreur lors du chargement des concentrateurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statut, base]);

  useEffect(() => {
    fetchConcentrateurs();
  }, [fetchConcentrateurs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statut, base]);

  const handleRowClick = (numeroSerie: string) => {
    navigate(`/concentrateurs/${numeroSerie}`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatut('');
    setBase('');
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Package size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Inventaire</h1>
              <p className={styles.subtitle}>
                {total.toLocaleString('fr-FR')} concentrateur{total > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par N° série ou modèle..."
          />
          <Filters
            statut={statut}
            base={base}
            onStatutChange={setStatut}
            onBaseChange={setBase}
            onReset={handleResetFilters}
          />
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <ConcentrateursTable
          concentrateurs={concentrateurs}
          loading={loading}
          onRowClick={handleRowClick}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
}
