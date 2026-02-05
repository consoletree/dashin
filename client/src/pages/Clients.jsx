import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ClientTable from '../components/ClientTable';
import Loading from '../components/Loading';
import { clientsApi } from '../utils/api';
import { useDebounce } from '../hooks/useData';

export default function Clients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    riskStatus: searchParams.get('riskStatus') || '',
    planTier: searchParams.get('planTier') || '',
    search: searchParams.get('search') || ''
  });

  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sortBy: 'currentHealthScore',
        order: 'asc'
      };
      
      if (filters.riskStatus) params.riskStatus = filters.riskStatus;
      if (filters.planTier) params.planTier = filters.planTier;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await clientsApi.getAll(params);
      setClients(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.error || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, filters.riskStatus, filters.planTier, debouncedSearch]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.riskStatus) params.set('riskStatus', filters.riskStatus);
    if (filters.planTier) params.set('planTier', filters.planTier);
    if (filters.search) params.set('search', filters.search);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  }, [filters, page, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500">
            {pagination?.total || 0} total clients
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-500/10 border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Client Table */}
      <ClientTable
        clients={clients}
        loading={loading}
        pagination={pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
