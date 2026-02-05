import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Filter,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import Loading from '../components/Loading';
import { incidentsApi } from '../utils/api';
import { 
  getSeverityColor, 
  getStatusColor, 
  formatRelativeTime 
} from '../utils/helpers';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    severity: ''
  });
  const [page, setPage] = useState(1);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;

      const response = await incidentsApi.getAll(params);
      setIncidents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.error || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-gray-500">
            {pagination?.total || 0} total incidents
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Filter className="w-4 h-4 text-gray-500" />
          
          <select
            className="input text-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            className="input text-sm"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">All Severity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {(filters.status || filters.severity) && (
            <button
              onClick={() => setFilters({ status: '', severity: '' })}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-500/10 border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Incidents List */}
      {loading ? (
        <Loading message="Loading incidents..." />
      ) : incidents.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">No incidents found</h2>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident, index) => {
            const severityColor = getSeverityColor(incident.severity);
            const statusColor = getStatusColor(incident.status);

            return (
              <div 
                key={incident._id}
                className="card hover:bg-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{incident.title}</h3>
                      <span className={`badge ${severityColor.bg} ${severityColor.text}`}>
                        {incident.severity}
                      </span>
                      <span className={`badge ${statusColor.bg} ${statusColor.text}`}>
                        {incident.status}
                      </span>
                    </div>

                    {incident.clientId && (
                      <Link 
                        to={`/clients/${incident.clientId._id || incident.clientId}`}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        {incident.clientId.company || incident.clientId.name || 'View Client'}
                      </Link>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {formatRelativeTime(incident.createdAt)}
                      </div>
                      {incident.assignedTo && incident.assignedTo !== 'Unassigned' && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.assignedTo}
                        </div>
                      )}
                      {incident.timeToResolve && (
                        <div className="flex items-center gap-1">
                          Resolved in {incident.timeToResolve} min
                        </div>
                      )}
                    </div>
                  </div>

                  {incident.slaBreached && (
                    <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                      SLA Breached
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
