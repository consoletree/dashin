import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, TrendingDown } from 'lucide-react';
import StatCard from '../components/StatCard';
import { UsageLineChart } from '../components/Charts';
import Loading from '../components/Loading';
import { analyticsApi } from '../utils/api';
import { formatNumber, getRiskColor, getTierColor } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function Dashboard({ darkMode }) {
  const [overview, setOverview] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, incidentsRes, usageRes] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getIncidentStats(),
          analyticsApi.getUsageMetrics({ days: 14 })
        ]);
        
        setOverview(overviewRes.data);
        setIncidentStats(incidentsRes.data);
        setUsageData(usageRes.data);
      } catch (err) {
        setError(err.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return <Loading message="Waking up server... This may take 30 seconds on first load." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>{error}</p>
      </div>
    );
  }

  const chartData = usageData?.map(day => ({
    date: day._id,
    ...day.metrics.reduce((acc, m) => ({ ...acc, [m.type]: m.value }), {})
  })) || [];

  const openIncidents = (incidentStats?.statusDistribution?.Open || 0) + 
                       (incidentStats?.statusDistribution?.['In Progress'] || 0);

  // Only show top 3 at-risk clients
  const topRiskClients = (overview?.atRiskClients || []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>Customer health overview</p>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={formatNumber(overview?.totalClients || 0)}
          subtitle="Active accounts"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Average Health"
          value={overview?.averageHealthScore || 0}
          subtitle="Platform-wide"
          icon={Activity}
          color={parseFloat(overview?.averageHealthScore) >= 70 ? 'emerald' : 'amber'}
        />
        <StatCard
          title="At Risk"
          value={
            (overview?.riskDistribution?.['At Risk'] || 0) + 
            (overview?.riskDistribution?.Critical || 0)
          }
          subtitle={`${overview?.recentRiskChanges || 0} new in 24h`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          subtitle={`Avg ${incidentStats?.averageResolutionTime || 0} min resolution`}
          icon={TrendingDown}
          color="red"
        />
      </div>

      {/* Main Content - 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Risk Radar - Limited to 3 clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="card-header mb-0 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Radar
            </div>
          </div>
          
          {topRiskClients.length === 0 ? (
            <div className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              All clients are healthy!
            </div>
          ) : (
            <div className="space-y-3">
              {topRiskClients.map((client) => {
                const riskColor = getRiskColor(client.riskStatus);
                const tierColor = getTierColor(client.planTier);
                return (
                  <Link
                    key={client._id}
                    to={`/clients/${client._id}`}
                    className={`block p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                      darkMode ? 'border-[#2a2a3a] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{client.company || client.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge text-xs ${riskColor.bg} ${riskColor.text}`}>
                            {client.riskStatus}
                          </span>
                          <span className={`badge text-xs ${tierColor.bg} ${tierColor.text}`}>
                            {client.planTier}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold ml-3" style={{ color: client.currentHealthScore >= 70 ? '#10b981' : client.currentHealthScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {client.currentHealthScore}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          <Link
            to="/clients?riskStatus=At%20Risk"
            className="block mt-4 text-center text-sm text-indigo-500 hover:text-indigo-400"
          >
            View all at-risk clients →
          </Link>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header mb-4">Risk Distribution</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { status: 'Healthy', color: '#10b981' },
              { status: 'At Risk', color: '#f59e0b' },
              { status: 'Critical', color: '#ef4444' },
              { status: 'Churned', color: '#6b7280' }
            ].map(({ status, color }) => {
              const count = overview?.riskDistribution?.[status] || 0;
              return (
                <div 
                  key={status} 
                  className={`text-center p-4 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                >
                  <div className="text-2xl font-bold" style={{ color }}>{count}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{status}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Breakdown */}
        <div className="card">
          <div className="card-header mb-4">Incident Breakdown</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { severity: 'Low', color: '#3b82f6' },
              { severity: 'Medium', color: '#f59e0b' },
              { severity: 'High', color: '#f97316' },
              { severity: 'Critical', color: '#ef4444' }
            ].map(({ severity, color }) => {
              const count = incidentStats?.severityDistribution?.[severity] || 0;
              return (
                <div 
                  key={severity} 
                  className={`text-center p-4 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                >
                  <div className="text-2xl font-bold" style={{ color }}>{count}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{severity}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart - Full Width */}
      <div className="card">
        <div className="card-header mb-4">Platform Usage (Last 14 Days)</div>
        <div className="h-64">
          {chartData.length > 0 ? (
            <UsageLineChart 
              data={chartData} 
              dataKey="api_calls"
              color="#6366f1"
            />
          ) : (
            <div className={`h-full flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              No usage data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
