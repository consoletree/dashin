import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, TrendingDown, ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import { UsageLineChart } from '../components/Charts';
import Loading from '../components/Loading';
import { analyticsApi } from '../utils/api';
import { formatNumber, getRiskColor, getTierColor } from '../utils/helpers';
import { Link } from 'react-router-dom';

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
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  const chartData = usageData?.map(day => ({
    date: day._id,
    ...day.metrics.reduce((acc, m) => ({ ...acc, [m.type]: m.value }), {})
  })) || [];

  const openIncidents = (incidentStats?.statusDistribution?.Open || 0) + 
                       (incidentStats?.statusDistribution?.['In Progress'] || 0);

  const topRiskClients = (overview?.atRiskClients || []).slice(0, 4);

  const riskData = [
    { status: 'Healthy', color: '#10b981', count: overview?.riskDistribution?.['Healthy'] || 0 },
    { status: 'At Risk', color: '#f59e0b', count: overview?.riskDistribution?.['At Risk'] || 0 },
    { status: 'Critical', color: '#ef4444', count: overview?.riskDistribution?.['Critical'] || 0 },
    { status: 'Churned', color: '#6b7280', count: overview?.riskDistribution?.['Churned'] || 0 }
  ];

  const incidentData = [
    { severity: 'Low', color: '#3b82f6', count: incidentStats?.severityDistribution?.['Low'] || 0 },
    { severity: 'Medium', color: '#f59e0b', count: incidentStats?.severityDistribution?.['Medium'] || 0 },
    { severity: 'High', color: '#f97316', count: incidentStats?.severityDistribution?.['High'] || 0 },
    { severity: 'Critical', color: '#ef4444', count: incidentStats?.severityDistribution?.['Critical'] || 0 }
  ];

  const totalRisk = riskData.reduce((sum, d) => sum + d.count, 0) || 1;
  const totalIncidents = incidentData.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Customer health overview</p>
        </div>
        <div className="text-sm text-gray-500">
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

      {/* Main Content - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column - Risk Radar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="card-header mb-0 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Radar
            </div>
            <Link
              to="/clients?riskStatus=At%20Risk"
              className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          {topRiskClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              🎉 All clients are healthy!
            </div>
          ) : (
            <div className="space-y-2">
              {topRiskClients.map((client) => {
                const riskColor = getRiskColor(client.riskStatus);
                const tierColor = getTierColor(client.planTier);
                const healthColor = client.currentHealthScore >= 70 ? '#10b981' : client.currentHealthScore >= 50 ? '#f59e0b' : '#ef4444';
                
                return (
                  <Link
                    key={client._id}
                    to={`/clients/${client._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2a2a3a] hover:bg-white/5 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: healthColor }}
                      >
                        {client.currentHealthScore}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{client.company || client.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`badge text-xs ${riskColor.bg} ${riskColor.text}`}>
                            {client.riskStatus}
                          </span>
                          <span className={`badge text-xs ${tierColor.bg} ${tierColor.text}`}>
                            {client.planTier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-600" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Stats Breakdown */}
        <div className="grid grid-rows-2 gap-4">
          {/* Risk Distribution */}
          <div className="card">
            <div className="card-header mb-3">Risk Distribution</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 rounded-full overflow-hidden flex bg-[#1a1a25]">
                  {riskData.map((item) => (
                    <div
                      key={item.status}
                      style={{ 
                        width: `${(item.count / totalRisk) * 100}%`,
                        backgroundColor: item.color
                      }}
                      className="h-full transition-all"
                      title={`${item.status}: ${item.count}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  {riskData.map((item) => (
                    <div key={item.status} className="text-center">
                      <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
                      <div className="text-xs text-gray-500">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Incident Breakdown */}
          <div className="card">
            <div className="card-header mb-3">Incident Breakdown</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 rounded-full overflow-hidden flex bg-[#1a1a25]">
                  {incidentData.map((item) => (
                    <div
                      key={item.severity}
                      style={{ 
                        width: `${(item.count / totalIncidents) * 100}%`,
                        backgroundColor: item.color
                      }}
                      className="h-full transition-all"
                      title={`${item.severity}: ${item.count}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  {incidentData.map((item) => (
                    <div key={item.severity} className="text-center">
                      <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
                      <div className="text-xs text-gray-500">{item.severity}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Full Width */}
      <div className="card">
        <div className="card-header mb-4">Platform Usage (Last 14 Days)</div>
        <div className="h-52">
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
    </div>
  );
}
