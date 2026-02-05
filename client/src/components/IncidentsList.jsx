import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, User, Tag } from 'lucide-react';
import { getSeverityColor, getStatusColor, formatRelativeTime } from '../utils/helpers';

export default function IncidentsList({ incidents, loading, showClient = true }) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">Recent Incidents</div>
        <div className="py-8 text-center text-gray-500 animate-pulse">
          Loading incidents...
        </div>
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="card">
        <div className="card-header">Recent Incidents</div>
        <div className="py-8 text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No incidents found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-0">
      <div className="p-4 border-b border-[#2a2a3a]">
        <div className="card-header mb-0">Recent Incidents</div>
      </div>
      
      <div className="divide-y divide-[#2a2a3a]/50">
        {incidents.map((incident, index) => {
          const severityColor = getSeverityColor(incident.severity);
          const statusColor = getStatusColor(incident.status);

          return (
            <div 
              key={incident._id} 
              className="p-4 hover:bg-white/5 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{incident.title}</h4>
                  {showClient && incident.clientId && (
                    <Link 
                      to={`/clients/${incident.clientId._id || incident.clientId}`}
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      {incident.clientId.company || incident.clientId.name || 'Unknown Client'}
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${severityColor.bg} ${severityColor.text}`}>
                    {incident.severity}
                  </span>
                  <span className={`badge ${statusColor.bg} ${statusColor.text}`}>
                    {incident.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(incident.createdAt)}
                </div>
                {incident.assignedTo && incident.assignedTo !== 'Unassigned' && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {incident.assignedTo}
                  </div>
                )}
                {incident.tags && incident.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {incident.tags.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
