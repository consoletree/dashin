import { Link } from 'react-router-dom';
import { ChevronRight, Search, Filter, ChevronLeft } from 'lucide-react';
import HealthScoreGauge from './HealthScoreGauge';
import { getRiskColor, getTierColor, formatCurrency, formatRelativeTime } from '../utils/helpers';

export default function ClientTable({ 
  clients, 
  loading, 
  pagination,
  filters,
  onFilterChange,
  onSearch,
  onPageChange 
}) {
  return (
    <div className="card p-0 overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-[#2a2a3a] flex flex-wrap gap-4 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            className="input pl-10 w-64"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="input text-sm"
            value={filters?.riskStatus || ''}
            onChange={(e) => onFilterChange?.('riskStatus', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Healthy">Healthy</option>
            <option value="At Risk">At Risk</option>
            <option value="Critical">Critical</option>
            <option value="Churned">Churned</option>
          </select>
          
          <select
            className="input text-sm"
            value={filters?.planTier || ''}
            onChange={(e) => onFilterChange?.('planTier', e.target.value)}
          >
            <option value="">All Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a3a]">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Health</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Contract</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <div className="animate-pulse">Loading clients...</div>
                </td>
              </tr>
            ) : clients?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              clients?.map((client, index) => {
                const riskColor = getRiskColor(client.riskStatus);
                const tierColor = getTierColor(client.planTier);

                return (
                  <tr 
                    key={client._id} 
                    className="border-b border-[#2a2a3a]/50 hover:bg-white/5 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{client.company}</div>
                        <div className="text-sm text-gray-500">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <HealthScoreGauge score={client.currentHealthScore} size="sm" showLabel={false} />
                        <span className="ml-2 font-medium">{client.currentHealthScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${riskColor.bg} ${riskColor.text}`}>
                        {client.riskStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${tierColor.bg} ${tierColor.text}`}>
                        {client.planTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(client.contractValue)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatRelativeTime(client.lastActive)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/clients/${client._id}`}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors inline-block"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="p-4 border-t border-[#2a2a3a] flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
