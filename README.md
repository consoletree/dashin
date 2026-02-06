# 🎯 Customer Intelligence Platform

A full-stack MERN application for real-time customer health monitoring, telemetry analysis, and support incident tracking.

## ⚡ Tech Stack & Architecture

| Layer | Technology | Key Decision Factor |
|-------|------------|---------------------|
| **Core** | MERN Stack | Enterprise-standard architecture |
| **Data** | MongoDB + Redis | Time-series for telemetry; caching for sub-ms dashboard reads |
| **Queues** | BullMQ | Distributed background processing for heavy calculations |
| **UI** | React + Tailwind | Component-driven architecture with fast HMR (Vite) |

### System Design Strategy

The architecture separates **Reads** (Dashboard) from **Writes** (Telemetry) to ensure scalability under load.

```text
[Telemetry Stream] --> (Async Write) --> [BullMQ Worker]
                                              |
                                          (Process)
                                              v
[Dashboard] <--(Fast Read)-- [Redis] <--(Update)-- [MongoDB]
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Up and running in one command
git clone https://www.github.com/consoletree/dashin
cd dashin
docker-compose up -d --build

# Seed data and access at http://localhost:3000
docker-compose exec api npm run seed
```

### Option 2: Local Dev

Requires Node 18+, MongoDB 6+, Redis 7+.

```bash
# Setup
npm run install:all
cp server/.env.example server/.env

# Run
npm run seed     # Populate mock data
npm run dev      # Start API & Frontend
npm run worker   # Start background jobs
```

## 🧠 Key Features

* **Health Score Engine:** Customizable algorithm weighting *Usage (40%)*, *Engagement (30%)*, and *Support Incidents (30%)*.
* **Real-time Dashboard:** Features "Risk Radar" and "Activity Heatmaps" powered by Recharts.
* **Simulation Mode:** Built-in tools to simulate outages, traffic spikes, and recovery scenarios for demos.
* **Performance:**
    * **Caching:** 2-minute TTL on heavy aggregations.
    * **Indexing:** Compound indexes on time-series collections.

## 📡 API Overview

Full documentation available at `http://localhost:5000/api-docs` (Swagger).

* **`/api/v1/clients`**: CRUD operations and usage telemetry.
* **`/api/v1/analytics`**: Aggregate health trends and revenue risk analysis.
* **`/api/v1/simulate`**: Trigger synthetic events (pulse, outage, reset) for testing.

## 🔧 Configuration

Manage settings in `server/.env`. Key variables:

* `CACHE_TTL`: Duration (in seconds) for Redis keys.
* `HEALTH_SCORE_CRON`: Schedule for background re-calculation.

To tweak the health algorithm logic, modify: `server/workers/healthScoreWorker.js`.

---

## 🤝 Contributing

1. Fork and branch (`git checkout -b feature/amazing-feature`)
2. Commit and push
3. Open a Pull Request

---
**Built to demonstrate system design, queue management, and data visualization skills.**
