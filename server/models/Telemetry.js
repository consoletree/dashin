import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  metricType: {
    type: String,
    enum: ['api_calls', 'storage_used', 'login_count', 'feature_usage', 'page_views', 'export_count'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  metadata: {
    endpoint: String,
    featureName: String,
    userAgent: String,
    responseTime: Number
  }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'clientId',
    granularity: 'hours'
  }
});

// Index for efficient time-range queries
telemetrySchema.index({ clientId: 1, timestamp: -1 });
telemetrySchema.index({ metricType: 1, timestamp: -1 });

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

export default Telemetry;
