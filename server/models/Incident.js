import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  tags: [{
    type: String,
    enum: ['bug', 'billing', 'feature_request', 'performance', 'security', 'integration', 'training', 'other']
  }],
  assignedTo: {
    type: String,
    default: 'Unassigned'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  timeToResolve: {
    type: Number, // in minutes
    default: null
  },
  slaBreached: {
    type: Boolean,
    default: false
  },
  communications: [{
    message: String,
    sender: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time elapsed since creation
incidentSchema.virtual('ageInHours').get(function() {
  const now = this.resolvedAt || new Date();
  const diff = now - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60));
});

// Index for efficient queries
incidentSchema.index({ clientId: 1, status: 1 });
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate time to resolve
incidentSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'Resolved' || this.status === 'Closed') && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.timeToResolve = Math.round((this.resolvedAt - this.createdAt) / (1000 * 60));
    
    // Check SLA breach (example: High severity should be resolved within 4 hours)
    const slaLimits = {
      'Critical': 60,    // 1 hour
      'High': 240,       // 4 hours
      'Medium': 480,     // 8 hours
      'Low': 1440        // 24 hours
    };
    
    if (this.timeToResolve > slaLimits[this.severity]) {
      this.slaBreached = true;
    }
  }
  next();
});

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
