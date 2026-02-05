import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/customer_intelligence');
console.log('✅ Connected to MongoDB');

const { default: Client } = await import('../models/Client.js');
const { default: Telemetry } = await import('../models/Telemetry.js');
const { default: Incident } = await import('../models/Incident.js');

const incidentTitles = [
  'API response time degradation',
  'Dashboard loading slowly',
  'Integration sync failure',
  'User authentication issues',
  'Data export timeout'
];

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function pulse() {
  const clients = await Client.find().select('_id name');
  const now = new Date();
  const telemetryRecords = [];

  console.log(`\n🔄 Pulse at ${now.toISOString()}`);

  for (const client of clients) {
    // API calls for everyone
    telemetryRecords.push({
      clientId: client._id,
      metricType: 'api_calls',
      value: randomNumber(20, 200),
      timestamp: now
    });

    // 70% chance of login activity
    if (Math.random() > 0.3) {
      telemetryRecords.push({
        clientId: client._id,
        metricType: 'login_count',
        value: randomNumber(1, 10),
        timestamp: now
      });
    }

    // 50% chance of page views
    if (Math.random() > 0.5) {
      telemetryRecords.push({
        clientId: client._id,
        metricType: 'page_views',
        value: randomNumber(10, 100),
        timestamp: now
      });
    }

    // 5% chance of new incident
    if (Math.random() < 0.05) {
      const severities = ['Low', 'Medium', 'High'];
      await Incident.create({
        clientId: client._id,
        title: incidentTitles[randomNumber(0, incidentTitles.length - 1)],
        description: 'Auto-generated incident from continuous seeder.',
        severity: severities[randomNumber(0, 2)],
        status: 'Open',
        tags: ['bug']
      });
      console.log(`  🎫 New incident for ${client.name}`);
    }

    // Update last active
    await Client.findByIdAndUpdate(client._id, { lastActive: now });
  }

  await Telemetry.insertMany(telemetryRecords);
  console.log(`  📊 Inserted ${telemetryRecords.length} telemetry records`);

  // 10% chance to resolve a random open incident
  if (Math.random() < 0.1) {
    const openIncident = await Incident.findOne({ status: 'Open' });
    if (openIncident) {
      openIncident.status = 'Resolved';
      openIncident.resolvedAt = now;
      await openIncident.save();
      console.log(`  ✅ Resolved incident: ${openIncident.title}`);
    }
  }
}

// Run pulse every minute
const INTERVAL = 60 * 1000; // 1 minute
console.log(`🚀 Continuous seeder started. Running every ${INTERVAL / 1000} seconds.`);
console.log('   Press Ctrl+C to stop.\n');

// Initial pulse
await pulse();

// Schedule recurring pulses
setInterval(pulse, INTERVAL);
