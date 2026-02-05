import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, TrendingDown } from 'lucide-react';
import HealthScoreGauge from './HealthScoreGauge';
import { getRiskColor, getTierColor } from '../utils/helpers';

export default function RiskRadar({ clients, recentChanges }) {
  if (!clients || clients.length === 0) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Risk Radar
        </div>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No at-risk clients</p>
          <p className="text-sm">All clients are healthy!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="card-header mb-0 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Risk Radar
        </div>
        {recentChanges > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <TrendingDown className="w-3 h-3" />
            {recentChanges} new in 24h
          </div>
        )}
      </div>

      <div className="space-y-3">
        {clients.map((client, index) => {
          const riskColor = getRiskColor(client.riskStatus);
          const tierColor = getTierColor(client.planTier);

          return (
            <Link
              key={client._id}
              to={`/clients/${client._id}`}
              className={`block p-4 rounded-lg border transition-all hover:bg-white/5 animate-fade-in ${riskColor.border}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <HealthScoreGauge score={client.currentHealthScore} size="sm" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{client.company || client.name}</h3>
                    <span className={`badge ${tierColor.bg} ${tierColor.text}`}>
                      {client.planTier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${riskColor.bg} ${riskColor.text}`}>
                      {client.riskStatus}
                    </span>
                    <span className="text-xs text-gray-500">{client.name}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        to="/clients?riskStatus=At%20Risk"
        className="block mt-4 text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        View all at-risk clients →
      </Link>
    </div>
  );
}
