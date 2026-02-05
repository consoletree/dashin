import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer Intelligence Platform API',
      version: '1.0.0',
      description: `
# Overview
A comprehensive API for managing customer health scores, telemetry data, and support incidents.

## Architecture Decisions

### Why MongoDB?
- **Time-Series Collections**: Native support for high-volume telemetry data with automatic data aging
- **Aggregation Framework**: Complex health score calculations happen at the database layer, not in application code
- **Flexible Schema**: Easy to add new metrics and client attributes without migrations

### Why Redis?
- **Caching Layer**: Dashboard queries are cached to handle high read loads
- **Job Queue**: BullMQ uses Redis for reliable background job processing
- **Rate Limiting**: Built-in support for API rate limiting (future enhancement)

### Why Background Workers?
- Health score calculations are expensive (30-day aggregations across telemetry + incidents)
- Calculating on every page load would overwhelm the database
- Scheduled jobs (every 10 mins) keep scores fresh without blocking requests

## Authentication
This demo API does not require authentication. In production, implement JWT or OAuth2.
      `,
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Clients',
        description: 'Client management endpoints'
      },
      {
        name: 'Analytics',
        description: 'Dashboard and analytics endpoints'
      },
      {
        name: 'Incidents',
        description: 'Support ticket management'
      },
      {
        name: 'Simulation',
        description: 'Demo simulation endpoints for testing'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
