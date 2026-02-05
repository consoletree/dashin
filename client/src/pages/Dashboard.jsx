import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, TrendingDown } from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskRadar from '../components/RiskRadar';
import { UsageLineChart } from '../components/Charts';
import Loading from '../components/Loading';
import { analyticsApi } from '../utils/api';
import { formatNumber } from '../utils/helpers';

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>Customer health overview</p>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
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

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Risk Radar */}
        <div className="xl:col-span-1 min-w-0 overflow-auto">
          <RiskRadar 
            clients={overview?.atRiskClients || []} 
            recentChanges={overview?.recentRiskChanges || 0}
          />
        </div>

        {/* Right Side */}
        <div className="xl:col-span-2 flex flex-col gap-4 min-w-0">
          {/* Chart */}
          <div className="card flex-1 min-h-0">
            <div className="card-header">Platform Usage (Last 14 Days)</div>
            <div className="h-48">
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

          {/* Bottom Grid - Risk Distribution & Incident Breakdown */}
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {/* Risk Distribution */}
            <div className="card">
              <div className="card-header mb-3">Risk Distribution</div>
              <div className="grid grid-cols-2 gap-2">
                {['Healthy', 'At Risk', 'Critical', 'Churned'].map(status => {
                  const count = overview?.riskDistribution?.[status] || 0;
                  const colorMap = {
                    'Healthy': 'text-emerald-500',
                    'At Risk': 'text-amber-500',
                    'Critical': 'text-red-500',
                    'Churned': 'text-gray-500'
                  };
                  return (
                    <div key={status} className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <div className={`text-xl font-bold ${colorMap[status]}`}>{count}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{status}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Incident Breakdown */}
            <div className="card">
              <div className="card-header mb-3">Incident Breakdown</div>
              <div className="grid grid-cols-2 gap-2">
                {['Low', 'Medium', 'High', 'Critical'].map(severity => {
                  const count = incidentStats?.severityDistribution?.[severity] || 0;
                  const colorMap = {
                    'Low': 'text-blue-500',
                    'Medium': 'text-amber-500',
                    'High': 'text-orange-500',
                    'Critical': 'text-red-500'
                  };
                  return (
                    <div key={severity} className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <div className={`text-xl font-bold ${colorMap[severity]}`}>{count}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{severity}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
