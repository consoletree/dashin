# 🎯 Customer Intelligence Platform

A full-stack MERN application demonstrating enterprise-grade architecture for customer health monitoring, telemetry analysis, and support incident tracking.

<!-- ![Dashboard Preview](https://www.dashin.itsaebin.com) -->

## 🏗️ Architecture Decisions

### Why This Stack?

| Technology | Purpose | Why This Choice |
|------------|---------|-----------------|
| **MongoDB** | Primary Database | Time-series collections for telemetry, aggregation pipelines for analytics |
| **Redis** | Caching + Queue | Sub-millisecond response for dashboard queries, reliable job processing |
| **BullMQ** | Background Jobs | Distributed, persistent job queue for health score calculations |
| **Express** | API Server | Lightweight, middleware-friendly, excellent ecosystem |
| **React + Vite** | Frontend | Fast HMR, optimal build output, modern DX |
| **Tailwind CSS** | Styling | Utility-first, highly customizable, small bundle |
| **Recharts** | Visualization | Composable, React-native, good performance |

### Database Design Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                     READ PATH (Fast)                         │
│  Dashboard → Redis Cache → Pre-computed scores from clients │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    WRITE PATH (Async)                        │
│  Telemetry → Time-series collection → Worker → Score update │
└─────────────────────────────────────────────────────────────┘
```

**Key insight**: Separating read and write concerns allows the dashboard to handle hundreds of concurrent viewers while telemetry ingestion continues uninterrupted.

### Health Score Algorithm

```javascript
Score = (0.4 × usage_score) + (0.3 × engagement_score) + (0.3 × incident_score)
```

| Component | Calculation | Weight |
|-----------|-------------|--------|
| Usage Score | API calls vs baseline (5000/month) | 40% |
| Engagement Score | Login frequency vs expected (30/month) | 30% |
| Incident Score | 100 - (severity-weighted penalties) | 30% |

This algorithm is transparent and explainable—critical for a customer success tool.

## 📁 Project Structure

```
customer-intelligence-platform/
├── server/                    # Backend API
│   ├── config/               # DB, Redis, Swagger config
│   ├── controllers/          # Business logic
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routes
│   ├── workers/              # BullMQ background jobs
│   └── scripts/              # Seeder utilities
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # API client, helpers
│   └── ...
├── docker-compose.yml        # Full stack orchestration
└── README.md
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
git clone <repository-url>
cd customer-intelligence-platform
docker-compose up -d

# Seed the database
docker-compose exec api npm run seed

# Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:5000/api-docs
```

### Option 2: Local Development

**Prerequisites:**
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Redis 7+

```bash
# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit .env with your MongoDB/Redis URLs

# Seed the database
npm run seed

# Start development servers (API + React)
npm run dev

# Optional: Start background worker
npm run worker
```

## 📊 API Endpoints

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clients` | List clients (paginated, filterable) |
| GET | `/api/v1/clients/:id` | Get client with usage summary |
| POST | `/api/v1/clients` | Create new client |
| PUT | `/api/v1/clients/:id` | Update client |
| DELETE | `/api/v1/clients/:id` | Delete client + related data |
| GET | `/api/v1/clients/:id/usage` | Usage chart data |
| GET | `/api/v1/clients/:id/heatmap` | Login heatmap data |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/overview` | Dashboard stats |
| GET | `/api/v1/analytics/health-trends` | Health trends over time |
| GET | `/api/v1/analytics/incidents` | Incident statistics |
| GET | `/api/v1/analytics/revenue-risk` | Revenue at risk breakdown |

### Simulation (Demo)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/simulate/pulse` | Generate activity for all clients |
| POST | `/api/v1/simulate/outage/:id` | Simulate incident + health drop |
| POST | `/api/v1/simulate/reset-health/:id` | Reset client to healthy |

📚 **Full API documentation available at `/api-docs`** (Swagger UI)

## 🎨 Frontend Features

### Dashboard
- **Risk Radar**: Real-time view of at-risk clients, sorted by health score
- **Platform Metrics**: Total clients, average health, open incidents
- **Usage Charts**: Platform-wide API usage trends
- **Incident Breakdown**: Severity and status distribution

### Client Detail
- **Health Score Gauge**: Visual representation with trend indicator
- **Usage Graph**: 30-day API usage with interactive tooltip
- **Activity Heatmap**: GitHub-style login frequency visualization
- **Action Panel**: Simulation controls for demos

### Responsive Design
- Collapsible sidebar on mobile
- Card-based layout adapts to screen size
- Touch-friendly interaction targets

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/customer_intelligence
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300
HEALTH_SCORE_CRON=*/10 * * * *
```

### Customizing Health Score Calculation

Edit `server/workers/healthScoreWorker.js`:

```javascript
// Adjust weights
const finalScore = Math.round(
  (0.4 * usageScore) +    // Increase for usage-focused products
  (0.3 * engagementScore) + // Increase for daily-use products
  (0.3 * incidentScore)     // Increase for support-heavy products
);

// Adjust baselines
const expectedCalls = 5000;  // Your product's healthy usage baseline
const expectedLogins = 30;    // Expected monthly logins
```

## 🧪 Testing the Dashboard

1. **Seed data**: `npm run seed` creates 15 clients with 30 days of history
2. **Run pulse**: Use the Simulation page or `POST /api/v1/simulate/pulse`
3. **Watch changes**: Dashboard auto-refreshes every 30 seconds
4. **Test scenarios**:
   - Click a client → "Simulate Outage" → Watch health drop
   - "Reset Health" → Watch client return to healthy
   - Run multiple pulses → See activity trends update

## 📈 Performance Considerations

### Caching Strategy
- Dashboard overview: 2 minute TTL
- Client details: 2 minute TTL
- Client list queries: 1 minute TTL
- Cache invalidation on writes

### Database Optimization
- Time-series collections for telemetry (automatic data compaction)
- Compound indexes on frequently queried fields
- Aggregation pipelines push computation to DB layer

### Scaling Notes
For production with 10,000+ clients:
1. Add read replicas for MongoDB
2. Use Redis Cluster for caching
3. Horizontal scale workers with BullMQ's built-in distribution
4. Consider pre-aggregating daily summaries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ to demonstrate full-stack engineering skills**

*This project showcases: system design, database optimization, background job processing, real-time data visualization, and production-ready deployment patterns.*
