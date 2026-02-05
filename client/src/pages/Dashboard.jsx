import { useState, useEffect } from 'react';
import { Users, AlertTriangle, DollarSign, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskRadar from '../components/RiskRadar';
import IncidentsList from '../components/IncidentsList';
import { UsageLineChart } from '../components/Charts';
import Loading from '../components/Loading';
import { analyticsApi } from '../utils/api';
import { formatNumber, formatCurrency } from '../utils/helpers';

export default function Dashboard() {
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // Transform usage data for chart
  const chartData = usageData?.map(day => ({
    date: day._id,
    ...day.metrics.reduce((acc, m) => ({ ...acc, [m.type]: m.value }), {})
  })) || [];

  const openIncidents = (incidentStats?.statusDistribution?.Open || 0) + 
                       (incidentStats?.statusDistribution?.['In Progress'] || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Customer health overview and insights</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          trend={parseFloat(overview?.averageHealthScore) >= 70 ? 'up' : 'down'}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Risk Radar - 1 column */}
        <div className="xl:col-span-1 min-w-0">
          <RiskRadar 
            clients={overview?.atRiskClients || []} 
            recentChanges={overview?.recentRiskChanges || 0}
          />
        </div>
      
        {/* Charts - 2 columns */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          {/* Usage Chart */}
          <div className="card">
            <div className="card-header">Platform Usage (Last 14 Days)</div>
            <div className="h-64">
              {chartData.length > 0 ? (
                <UsageLineChart 
                  data={chartData} 
                  dataKey="api_calls"
                  color="#6366f1"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No usage data available
                </div>
              )}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Healthy', 'At Risk', 'Critical', 'Churned'].map(status => {
              const count = overview?.riskDistribution?.[status] || 0;
              const colors = {
                'Healthy': 'emerald',
                'At Risk': 'amber',
                'Critical': 'red',
                'Churned': 'purple'
              };
              
              return (
                <div key={status} className="card text-center">
                  <div className="text-sm text-gray-500 mb-2">{status}</div>
                  <div className={`text-2xl font-bold text-${colors[status]}-400`}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incidents Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentsList 
          incidents={incidentStats?.recentIncidents || []} 
          loading={loading}
        />
        
        {/* Incident Stats */}
        <div className="card">
          <div className="card-header">Incident Breakdown</div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-2">By Severity</div>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High', 'Critical'].map(severity => {
                  const count = incidentStats?.severityDistribution?.[severity] || 0;
                  const colors = {
                    'Low': 'bg-blue-500/20 text-blue-400',
                    'Medium': 'bg-amber-500/20 text-amber-400',
                    'High': 'bg-orange-500/20 text-orange-400',
                    'Critical': 'bg-red-500/20 text-red-400'
                  };
                  
                  return (
                    <div key={severity} className={`flex-1 p-3 rounded-lg ${colors[severity]}`}>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs opacity-80">{severity}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">By Status</div>
              <div className="space-y-2">
                {['Open', 'In Progress', 'Pending', 'Resolved'].map(status => {
                  const count = incidentStats?.statusDistribution?.[status] || 0;
                  const total = Object.values(incidentStats?.statusDistribution || {}).reduce((a, b) => a + b, 1);
                  const percentage = Math.round((count / total) * 100);
                  
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{status}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {incidentStats?.totalSLABreaches > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">{incidentStats.totalSLABreaches} SLA Breaches</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
