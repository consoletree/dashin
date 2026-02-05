import express from 'express';
import {
  getOverviewStats,
  getHealthTrends,
  getIncidentStats,
  getUsageMetrics,
  getRevenueAtRisk
} from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard overview stats
 */
router.get('/overview', getOverviewStats);

/**
 * @swagger
 * /api/v1/analytics/health-trends:
 *   get:
 *     summary: Get health score trends over time
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get('/health-trends', getHealthTrends);

/**
 * @swagger
 * /api/v1/analytics/incidents:
 *   get:
 *     summary: Get incident statistics
 *     tags: [Analytics]
 */
router.get('/incidents', getIncidentStats);

/**
 * @swagger
 * /api/v1/analytics/usage:
 *   get:
 *     summary: Get platform-wide usage metrics
 *     tags: [Analytics]
 */
router.get('/usage', getUsageMetrics);

/**
 * @swagger
 * /api/v1/analytics/revenue-risk:
 *   get:
 *     summary: Get revenue at risk calculations
 *     tags: [Analytics]
 */
router.get('/revenue-risk', getRevenueAtRisk);

export default router;
