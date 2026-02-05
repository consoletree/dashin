import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'indigo'
}) {
  const colorClasses = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/30',
    red: 'from-red-600/20 to-red-600/5 border-red-500/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30'
  };

  const iconColorClasses = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className="card-header mb-0">{title}</div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-black/20 ${iconColorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="stat-value mb-1">{value}</div>
      <div className="flex items-center justify-between">
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
