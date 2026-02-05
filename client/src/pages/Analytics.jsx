import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import { analyticsApi } from '../utils/api';
import { formatCurrency, formatNumber } from '../utils/helpers';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];
const TIER_COLORS = ['#B45309', '#9CA3AF', '#EAB308', '#8B5CF6'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, revenueRes] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getRevenueAtRisk()
        ]);
        
        setOverview(overviewRes.data);
        setRevenueData(revenueRes.data);
      } catch (err) {
        setError(err.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading message="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Failed to load analytics</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // Transform data for charts
  const riskPieData = Object.entries(overview?.riskDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const tierData = Object.entries(overview?.tierDistribution || {}).map(([name, data]) => ({
    name,
    clients: data.count,
    revenue: data.revenue
  }));

  const revenueByRiskData = revenueData?.revenueByRisk?.map(item => ({
    name: item._id,
    revenue: item.totalRevenue,
    clients: item.clientCount
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">Deep dive into customer metrics</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueData?.totalRevenue || 0)}
          subtitle="Active contracts"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Revenue at Risk"
          value={formatCurrency(revenueData?.atRiskRevenue || 0)}
          subtitle={`${revenueData?.riskPercentage || 0}% of total`}
          icon={AlertTriangle}
          color="amber"
          trend="down"
          trendValue={`${revenueData?.riskPercentage || 0}%`}
        />
        <StatCard
          title="Average Health"
          value={overview?.averageHealthScore || 0}
          subtitle="Across all clients"
          icon={TrendingUp}
          color={parseFloat(overview?.averageHealthScore) >= 70 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Client Risk Distribution
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e2a', 
                    border: '1px solid #3a3a4a',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#a5b4fc' }}
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Tier Bar Chart */}
        <div className="card">
          <div className="card-header">Revenue by Plan Tier</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a25', 
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue at Risk Breakdown */}
      <div className="card">
        <div className="card-header">Revenue by Risk Status</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Clients</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {revenueByRiskData.map((row, index) => {
                const percentage = ((row.revenue / revenueData?.totalRevenue) * 100).toFixed(1);
                const isAtRisk = ['At Risk', 'Critical'].includes(row.name);
                
                return (
                  <tr 
                    key={row.name} 
                    className="border-b border-[#2a2a3a]/50 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className={isAtRisk ? 'text-amber-400' : ''}>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{row.clients}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-white/5">
                <td className="px-4 py-3 font-medium">Total</td>
                <td className="px-4 py-3 text-right font-medium">
                  {overview?.totalClients || 0}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(revenueData?.totalRevenue || 0)}
                </td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tierData.map((tier, index) => (
          <div key={tier.name} className="card text-center">
            <div 
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${TIER_COLORS[index]}30` }}
            >
              <span className="text-xl font-bold" style={{ color: TIER_COLORS[index] }}>
                {tier.clients}
              </span>
            </div>
            <div className="font-medium">{tier.name}</div>
            <div className="text-sm text-gray-500">{formatCurrency(tier.revenue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
