import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Building, 
  User, 
  Calendar, 
  DollarSign,
  Zap,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import HealthScoreGauge from '../components/HealthScoreGauge';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { UsageLineChart } from '../components/Charts';
import IncidentsList from '../components/IncidentsList';
import Loading from '../components/Loading';
import { clientsApi, simulationApi } from '../utils/api';
import { 
  getRiskColor, 
  getTierColor, 
  formatCurrency, 
  formatDate, 
  formatRelativeTime 
} from '../utils/helpers';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const [clientRes, usageRes, heatmapRes] = await Promise.all([
        clientsApi.getOne(id),
        clientsApi.getUsage(id, { days: 30 }),
        clientsApi.getHeatmap(id, { weeks: 12 })
      ]);
      
      setClient(clientRes.data);
      
      // Transform usage data for charts
      const apiUsage = usageRes.data?.find(m => m._id === 'api_calls')?.data || [];
      setUsageData(apiUsage);
      
      setHeatmapData(heatmapRes.data);
    } catch (err) {
      setError(err.error || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleSimulateOutage = async (severity) => {
    try {
      setActionLoading('outage');
      await simulationApi.outage(id, { severity });
      await fetchClient();
    } catch (err) {
      alert('Failed to simulate outage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetHealth = async () => {
    try {
      setActionLoading('reset');
      await simulationApi.resetHealth(id);
      await fetchClient();
    } catch (err) {
      alert('Failed to reset health');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUsageSpike = async () => {
    try {
      setActionLoading('spike');
      await simulationApi.usageSpike(id, { multiplier: 3 });
      await fetchClient();
    } catch (err) {
      alert('Failed to simulate usage spike');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <Loading message="Loading client details..." />;
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Client not found</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/clients" className="btn-primary">
          Back to Clients
        </Link>
      </div>
    );
  }

  const riskColor = getRiskColor(client.riskStatus);
  const tierColor = getTierColor(client.planTier);
  const healthTrend = client.currentHealthScore - client.previousHealthScore;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link 
        to="/clients" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Health Score */}
          <div className="flex-shrink-0">
            <HealthScoreGauge score={client.currentHealthScore} size="lg" />
          </div>

          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold truncate">{client.company}</h1>
              <span className={`badge ${riskColor.bg} ${riskColor.text}`}>
                {client.riskStatus}
              </span>
              <span className={`badge ${tierColor.bg} ${tierColor.text}`}>
                {client.planTier}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span>{client.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(client.contractValue)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Active {formatRelativeTime(client.lastActive)}</span>
              </div>
            </div>

            {/* Health Trend */}
            {healthTrend !== 0 && (
              <div className={`inline-flex items-center gap-1 mt-3 text-sm ${
                healthTrend > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {healthTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {healthTrend > 0 ? '+' : ''}{healthTrend} from previous score
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleUsageSpike}
              disabled={actionLoading}
              className="btn-secondary flex items-center gap-2"
            >
              {actionLoading === 'spike' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Simulate Usage Spike
            </button>
            <button
              onClick={() => handleSimulateOutage('High')}
              disabled={actionLoading}
              className="btn-danger flex items-center gap-2"
            >
              {actionLoading === 'outage' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Simulate Outage
            </button>
            <button
              onClick={handleResetHealth}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-2"
            >
              {actionLoading === 'reset' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Reset Health
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="card">
          <div className="card-header">API Usage (Last 30 Days)</div>
          <div className="h-64">
            {usageData.length > 0 ? (
              <UsageLineChart data={usageData} dataKey="value" color="#6366f1" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No usage data available
              </div>
            )}
          </div>
        </div>

        {/* Activity Heatmap */}
        <ActivityHeatmap data={heatmapData} title="Login Activity (Last 12 Weeks)" />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integrations */}
        <div className="card">
          <div className="card-header">Active Integrations</div>
          {client.integrations && client.integrations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {client.integrations.map(integration => (
                <span 
                  key={integration}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm"
                >
                  {integration}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No integrations configured</p>
          )}
        </div>

        {/* Usage Summary */}
        <div className="card">
          <div className="card-header">Usage Summary (30 Days)</div>
          <div className="space-y-3">
            {client.usageSummary && client.usageSummary.length > 0 ? (
              client.usageSummary.map(metric => (
                <div key={metric._id} className="flex justify-between items-center">
                  <span className="text-gray-400 capitalize">
                    {metric._id.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">
                    {metric.total.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No usage data available</p>
            )}
          </div>
        </div>

        {/* Contract Info */}
        <div className="card">
          <div className="card-header">Contract Details</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Manager</span>
              <span>{client.accountManager}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Start Date</span>
              <span>{formatDate(client.contractStartDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">End Date</span>
              <span>{formatDate(client.contractEndDate)}</span>
            </div>
            {client.daysUntilRenewal && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Days to Renewal</span>
                <span className={client.daysUntilRenewal < 30 ? 'text-amber-400' : ''}>
                  {client.daysUntilRenewal}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <IncidentsList 
        incidents={client.recentIncidents || []} 
        showClient={false}
      />
    </div>
  );
}
