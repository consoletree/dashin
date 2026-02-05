import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/customer_intelligence');
console.log('✅ Connected to MongoDB');

// Import models
const { default: Client } = await import('../models/Client.js');
const { default: Telemetry } = await import('../models/Telemetry.js');
const { default: Incident } = await import('../models/Incident.js');

// Sample data
const companies = [
  { name: 'Acme Corporation', industry: 'Technology', region: 'North America' },
  { name: 'GlobalTech Solutions', industry: 'Software', region: 'Europe' },
  { name: 'Pacific Dynamics', industry: 'Manufacturing', region: 'Asia Pacific' },
  { name: 'Atlas Industries', industry: 'Finance', region: 'North America' },
  { name: 'Vertex Systems', industry: 'Healthcare', region: 'Europe' },
  { name: 'Quantum Innovations', industry: 'Technology', region: 'North America' },
  { name: 'Stellar Networks', industry: 'Telecommunications', region: 'Asia Pacific' },
  { name: 'Horizon Enterprises', industry: 'Retail', region: 'Latin America' },
  { name: 'Pinnacle Group', industry: 'Finance', region: 'Middle East' },
  { name: 'Nexus Digital', industry: 'Media', region: 'Europe' },
  { name: 'Catalyst Partners', industry: 'Consulting', region: 'North America' },
  { name: 'Aurora Labs', industry: 'Biotechnology', region: 'Europe' },
  { name: 'Meridian Tech', industry: 'Software', region: 'North America' },
  { name: 'Synergy Solutions', industry: 'IT Services', region: 'Asia Pacific' },
  { name: 'Fusion Dynamics', industry: 'Energy', region: 'Middle East' }
];

const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda', 'William', 'Stephanie', 'Thomas', 'Nicole', 'Christopher'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];

const accountManagers = ['Alex Chen', 'Maria Rodriguez', 'James Wilson', 'Sarah Kim', 'David Thompson'];
const planTiers = ['Bronze', 'Silver', 'Gold', 'Enterprise'];
const integrations = ['Slack', 'HubSpot', 'Salesforce', 'Jira', 'GitHub', 'Zendesk', 'Intercom'];

const incidentTitles = [
  'API response time degradation',
  'Dashboard loading slowly',
  'Integration sync failure',
  'User authentication issues',
  'Data export timeout',
  'Webhook delivery delays',
  'Report generation error',
  'Search functionality broken',
  'Email notifications not sending',
  'Mobile app crashes on startup'
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}

async function seed() {
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    Client.deleteMany({}),
    Telemetry.deleteMany({}),
    Incident.deleteMany({})
  ]);

  console.log('👥 Creating clients...');
  const clients = [];

  for (const company of companies) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const tier = randomElement(planTiers);
    
    const contractValues = {
      Bronze: randomNumber(5000, 15000),
      Silver: randomNumber(15000, 50000),
      Gold: randomNumber(50000, 150000),
      Enterprise: randomNumber(150000, 500000)
    };

    const client = await Client.create({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
      company: company.name,
      planTier: tier,
      accountManager: randomElement(accountManagers),
      currentHealthScore: randomNumber(40, 100),
      integrations: integrations.slice(0, randomNumber(1, 4)),
      contractValue: contractValues[tier],
      contractStartDate: randomDate(365),
      contractEndDate: new Date(Date.now() + randomNumber(30, 365) * 24 * 60 * 60 * 1000),
      lastActive: randomDate(7),
      metadata: {
        industry: company.industry,
        employeeCount: randomNumber(50, 5000),
        region: company.region
      }
    });

    clients.push(client);
    console.log(`  ✓ Created: ${company.name} (${tier})`);
  }

  console.log('\n📊 Generating telemetry data...');
  const telemetryRecords = [];
  const metricTypes = ['api_calls', 'storage_used', 'login_count', 'feature_usage', 'page_views'];

  for (const client of clients) {
    // Generate 30 days of telemetry
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Multiple entries per day
      for (let entry = 0; entry < randomNumber(3, 8); entry++) {
        const entryDate = new Date(date);
        entryDate.setHours(randomNumber(8, 20), randomNumber(0, 59));
        
        for (const metricType of metricTypes) {
          // Skip some metrics randomly
          if (Math.random() > 0.7) continue;
          
          let value;
          switch (metricType) {
            case 'api_calls':
              value = randomNumber(50, 500);
              break;
            case 'storage_used':
              value = randomNumber(100, 1000); // MB
              break;
            case 'login_count':
              value = randomNumber(1, 20);
              break;
            case 'feature_usage':
              value = randomNumber(10, 100);
              break;
            case 'page_views':
              value = randomNumber(50, 300);
              break;
          }

          telemetryRecords.push({
            clientId: client._id,
            metricType,
            value,
            timestamp: entryDate
          });
        }
      }
    }
  }

  // Batch insert telemetry
  const batchSize = 1000;
  for (let i = 0; i < telemetryRecords.length; i += batchSize) {
    await Telemetry.insertMany(telemetryRecords.slice(i, i + batchSize));
    process.stdout.write(`\r  ✓ Inserted ${Math.min(i + batchSize, telemetryRecords.length)}/${telemetryRecords.length} telemetry records`);
  }
  console.log('');

  console.log('\n🎫 Creating incidents...');
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
  const tags = ['bug', 'billing', 'feature_request', 'performance', 'security', 'integration'];

  for (const client of clients) {
    // Create 0-5 incidents per client
    const incidentCount = randomNumber(0, 5);
    
    for (let i = 0; i < incidentCount; i++) {
      const status = randomElement(statuses);
      const createdAt = randomDate(30);
      
      await Incident.create({
        clientId: client._id,
        title: randomElement(incidentTitles),
        description: `This is a sample incident for ${client.company}. Generated during database seeding.`,
        severity: randomElement(severities),
        status,
        priority: randomNumber(1, 5),
        tags: [randomElement(tags), randomElement(tags)].filter((v, i, a) => a.indexOf(v) === i),
        assignedTo: randomElement(accountManagers),
        createdAt,
        resolvedAt: ['Resolved', 'Closed'].includes(status) ? new Date(createdAt.getTime() + randomNumber(1, 72) * 60 * 60 * 1000) : null
      });
    }
  }

  // Count incidents
  const incidentCount = await Incident.countDocuments();
  console.log(`  ✓ Created ${incidentCount} incidents`);

  console.log('\n✅ Seeding complete!');
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${telemetryRecords.length} telemetry records`);
  console.log(`   - ${incidentCount} incidents`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
