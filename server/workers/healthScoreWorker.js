import { Worker, Queue } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/customer_intelligence');
console.log('✅ Worker connected to MongoDB');

// Import models after connection
const { default: Client } = await import('../models/Client.js');
const { default: Telemetry } = await import('../models/Telemetry.js');
const { default: Incident } = await import('../models/Incident.js');

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379
};

// Create the queue
const healthScoreQueue = new Queue('healthScoreCalculation', { connection });

/**
 * Health Score Calculation Algorithm
 * 
 * Score = (0.4 × usage_score) + (0.3 × engagement_score) + (0.3 × incident_score)
 * 
 * - usage_score: Based on API calls relative to plan average
 * - engagement_score: Based on login frequency
 * - incident_score: Penalty for open incidents
 */
async function calculateHealthScore(clientId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get usage data
  const usageData = await Telemetry.aggregate([
    {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
        timestamp: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$metricType',
        total: { $sum: '$value' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get open incidents
  const openIncidents = await Incident.aggregate([
    {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
        status: { $in: ['Open', 'In Progress', 'Pending'] }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  // Calculate usage score (0-100)
  const apiCalls = usageData.find(d => d._id === 'api_calls')?.total || 0;
  const expectedCalls = 5000; // Baseline for healthy usage
  const usageScore = Math.min(100, (apiCalls / expectedCalls) * 100);

  // Calculate engagement score (0-100)
  const logins = usageData.find(d => d._id === 'login_count')?.total || 0;
  const expectedLogins = 30; // ~1 per day
  const engagementScore = Math.min(100, (logins / expectedLogins) * 100);

  // Calculate incident penalty
  let incidentPenalty = 0;
  const severityWeights = { Critical: 25, High: 15, Medium: 8, Low: 3 };
  
  for (const incident of openIncidents) {
    incidentPenalty += (severityWeights[incident._id] || 5) * incident.count;
  }
  
  const incidentScore = Math.max(0, 100 - incidentPenalty);

  // Calculate final score
  const finalScore = Math.round(
    (0.4 * usageScore) + 
    (0.3 * engagementScore) + 
    (0.3 * incidentScore)
  );

  return Math.max(0, Math.min(100, finalScore));
}

// Create the worker
const worker = new Worker(
  'healthScoreCalculation',
  async (job) => {
    console.log(`🔄 Processing job: ${job.name}`);

    if (job.name === 'calculateAllHealthScores') {
      const clients = await Client.find().select('_id name currentHealthScore');
      let updated = 0;

      for (const client of clients) {
        try {
          const newScore = await calculateHealthScore(client._id);
          
          await Client.findByIdAndUpdate(client._id, {
            previousHealthScore: client.currentHealthScore,
            currentHealthScore: newScore
          });
          
          updated++;
          console.log(`  ✓ ${client.name}: ${client.currentHealthScore} → ${newScore}`);
        } catch (error) {
          console.error(`  ✗ Error updating ${client.name}:`, error.message);
        }
      }

      return { updated, total: clients.length };
    }

    if (job.name === 'calculateSingleHealthScore') {
      const { clientId } = job.data;
      const client = await Client.findById(clientId);
      
      if (!client) {
        throw new Error('Client not found');
      }

      const newScore = await calculateHealthScore(clientId);
      
      await Client.findByIdAndUpdate(clientId, {
        previousHealthScore: client.currentHealthScore,
        currentHealthScore: newScore
      });

      return { clientId, previousScore: client.currentHealthScore, newScore };
    }
  },
  { connection }
);

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.name} completed:`, result);
});

worker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.name} failed:`, error.message);
});

// Schedule recurring job
async function scheduleRecurringJobs() {
  // Remove existing repeatable jobs
  const repeatableJobs = await healthScoreQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await healthScoreQueue.removeRepeatableByKey(job.key);
  }

  // Add new repeatable job (every 10 minutes for demo, use '0 0 * * *' for midnight in production)
  await healthScoreQueue.add(
    'calculateAllHealthScores',
    {},
    {
      repeat: {
        pattern: process.env.HEALTH_SCORE_CRON || '*/10 * * * *'
      }
    }
  );

  console.log('✅ Scheduled health score calculation job');
}

// Also export function to trigger manual calculation
export async function triggerHealthScoreCalculation(clientId = null) {
  if (clientId) {
    await healthScoreQueue.add('calculateSingleHealthScore', { clientId });
  } else {
    await healthScoreQueue.add('calculateAllHealthScores', {});
  }
}

scheduleRecurringJobs();

console.log('🚀 Health Score Worker is running...');
