import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  planTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Enterprise'],
    default: 'Bronze'
  },
  accountManager: {
    type: String,
    default: 'Unassigned'
  },
  currentHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  previousHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  riskStatus: {
    type: String,
    enum: ['Healthy', 'At Risk', 'Critical', 'Churned'],
    default: 'Healthy'
  },
  integrations: [{
    type: String,
    enum: ['Slack', 'HubSpot', 'Salesforce', 'Jira', 'GitHub', 'Zendesk', 'Intercom']
  }],
  contractValue: {
    type: Number,
    default: 0
  },
  contractStartDate: {
    type: Date,
    default: Date.now
  },
  contractEndDate: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  metadata: {
    industry: String,
    employeeCount: Number,
    region: {
      type: String,
      enum: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days until contract renewal
clientSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.contractEndDate) return null;
  const now = new Date();
  const diff = this.contractEndDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for health trend
clientSchema.virtual('healthTrend').get(function() {
  const diff = this.currentHealthScore - this.previousHealthScore;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
});

// Index for efficient queries
clientSchema.index({ riskStatus: 1, currentHealthScore: 1 });
clientSchema.index({ planTier: 1 });
clientSchema.index({ lastActive: -1 });

// Pre-save middleware to update risk status based on health score
clientSchema.pre('save', function(next) {
  if (this.isModified('currentHealthScore')) {
    if (this.currentHealthScore >= 70) {
      this.riskStatus = 'Healthy';
    } else if (this.currentHealthScore >= 50) {
      this.riskStatus = 'At Risk';
    } else if (this.currentHealthScore >= 25) {
      this.riskStatus = 'Critical';
    } else {
      this.riskStatus = 'Churned';
    }
  }
  next();
});

const Client = mongoose.model('Client', clientSchema);

export default Client;
