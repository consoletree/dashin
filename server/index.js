import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import swaggerSpec from './config/swagger.js';
import {
  clientRoutes,
  analyticsRoutes,
  incidentRoutes,
  simulationRoutes
} from './routes/index.js';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Customer Intelligence API'
}));

// API Routes
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/simulate', simulationRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Customer Intelligence Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      clients: '/api/v1/clients',
      analytics: '/api/v1/analytics',
      incidents: '/api/v1/incidents',
      simulation: '/api/v1/simulate',
      health: '/api/v1/health'
    }
  });
});

// Seed endpoint (for production seeding)
app.get('/api/v1/seed', async (req, res) => {
  try {
    const { Client, Telemetry, Incident } = await import('./models/index.js');
    
    // Check if already seeded
    const existingClients = await Client.countDocuments();
    if (existingClients > 0) {
      return res.json({ 
        success: false, 
        message: `Database already has ${existingClients} clients. Delete them first or use /api/v1/seed?force=true` 
      });
    }

    // Sample data
    const companies = [
      'Acme Corp', 'GlobalTech', 'Pacific Dynamics', 'Atlas Industries', 
      'Vertex Systems', 'Quantum Innovations', 'Stellar Networks', 
      'Horizon Enterprises', 'Pinnacle Group', 'Nexus Digital',
      'Catalyst Partners', 'Aurora Labs', 'Meridian Tech', 
      'Synergy Solutions', 'Fusion Dynamics'
    ];
    
    const tiers = ['Bronze', 'Silver', 'Gold', 'Enterprise'];
    const statuses = ['Healthy', 'At Risk', 'Critical'];
    
    // Create clients
    const clients = [];
    for (let i = 0; i < companies.length; i++) {
      const client = await Client.create({
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@${companies[i].toLowerCase().replace(/\s+/g, '')}.com`,
        company: companies[i],
        planTier: tiers[Math.floor(Math.random() * tiers.length)],
        currentHealthScore: Math.floor(Math.random() * 60) + 40,
        contractValue: Math.floor(Math.random() * 100000) + 10000,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
      clients.push(client);
    }

    // Create telemetry data (30 days)
    for (const client of clients) {
      for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        
        await Telemetry.create({
          clientId: client._id,
          metricType: 'api_calls',
          value: Math.floor(Math.random() * 500) + 50,
          timestamp: date
        });
        
        await Telemetry.create({
          clientId: client._id,
          metricType: 'login_count',
          value: Math.floor(Math.random() * 20) + 1,
          timestamp: date
        });
      }
    }

    // Create some incidents
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    for (let i = 0; i < 10; i++) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      await Incident.create({
        clientId: randomClient._id,
        title: `Support Ticket #${1000 + i}`,
        description: 'Sample incident for testing',
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: Math.random() > 0.5 ? 'Open' : 'Resolved',
        tags: ['bug']
      });
    }

    res.json({ 
      success: true, 
      message: `Seeded ${clients.length} clients with telemetry and incidents` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (non-blocking - will work without it)
    connectRedis();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Customer Intelligence Platform API                    ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${PORT}              ║
║  📚 API Docs at http://localhost:${PORT}/api-docs           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
