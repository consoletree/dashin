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
