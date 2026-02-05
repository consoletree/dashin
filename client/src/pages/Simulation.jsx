import { useState } from 'react';
import { 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { simulationApi } from '../utils/api';

export default function Simulation() {
  const [loading, setLoading] = useState(null);
  const [results, setResults] = useState([]);

  const addResult = (action, success, message) => {
    setResults(prev => [{
      id: Date.now(),
      action,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 9)]);
  };

  const handlePulse = async () => {
    try {
      setLoading('pulse');
      const response = await simulationApi.pulse();
      addResult('Pulse', true, `Generated ${response.data.telemetryRecords} records, ${response.data.incidentsCreated.length} incidents`);
    } catch (err) {
      addResult('Pulse', false, err.error || 'Failed to run pulse');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Simulation Control Center</h1>
        <p className="text-gray-500">Generate test data and simulate scenarios</p>
      </div>

      {/* Warning Banner */}
      <div className="card bg-amber-500/10 border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-400">Demo Environment</h3>
            <p className="text-sm text-amber-400/80 mt-1">
              These controls modify data in real-time. Use them to test the dashboard's 
              responsiveness to changes in health scores, usage patterns, and incidents.
            </p>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pulse Action */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium">Run Pulse</h3>
              <p className="text-sm text-gray-500">Generate activity for all clients</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Simulates one cycle of the continuous seeder: generates API calls, logins, 
            and has a 5% chance of creating new incidents per client.
          </p>
          <button
            onClick={handlePulse}
            disabled={loading === 'pulse'}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading === 'pulse' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Pulse
          </button>
        </div>

        {/* Bulk Actions Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium">Client Actions</h3>
              <p className="text-sm text-gray-500">Available on client detail pages</p>
            </div>
          </div>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span><strong>Usage Spike:</strong> Generate high API activity</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span><strong>Simulate Outage:</strong> Create incident & reduce health</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>Reset Health:</strong> Restore health to 100</span>
            </li>
          </ul>
        </div>

        {/* Background Worker Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Background Worker</h3>
              <p className="text-sm text-gray-500">Automatic health recalculation</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            The BullMQ worker runs every 10 minutes (configurable) to recalculate 
            health scores based on:
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 40% - Usage activity (API calls)</li>
            <li>• 30% - Engagement (login frequency)</li>
            <li>• 30% - Incident impact (open tickets)</li>
          </ul>
        </div>
      </div>

      {/* Results Log */}
      <div className="card">
        <div className="card-header">Activity Log</div>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No actions performed yet</p>
            <p className="text-sm">Run a simulation to see results here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map(result => (
              <div 
                key={result.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.action}</span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Note */}
      <div className="card bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/30">
        <h3 className="font-medium text-indigo-300 mb-3">📋 Architecture Notes</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-white">Why simulate?</strong> Without real users, the dashboard 
            would show static data. The pulse simulation keeps data fresh and demonstrates 
            real-time updates.
          </p>
          <p>
            <strong className="text-white">In production:</strong> Replace the seeder with real 
            telemetry ingestion. The MongoDB aggregation pipelines and Redis caching are designed 
            to handle high-volume production loads.
          </p>
        </div>
      </div>
    </div>
  );
}
