import express from 'express';
import {
  simulateUsageSpike,
  simulateOutage,
  resetHealth,
  simulatePulse
} from '../controllers/simulationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/simulate/usage-spike/{clientId}:
 *   post:
 *     summary: Simulate usage spike for a client
 *     tags: [Simulation]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               multiplier:
 *                 type: number
 *                 default: 3
 */
router.post('/usage-spike/:clientId', simulateUsageSpike);

/**
 * @swagger
 * /api/v1/simulate/outage/{clientId}:
 *   post:
 *     summary: Simulate outage/incident for a client
 *     tags: [Simulation]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               severity:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 */
router.post('/outage/:clientId', simulateOutage);

/**
 * @swagger
 * /api/v1/simulate/reset-health/{clientId}:
 *   post:
 *     summary: Reset client health score to 100
 *     tags: [Simulation]
 */
router.post('/reset-health/:clientId', resetHealth);

/**
 * @swagger
 * /api/v1/simulate/pulse:
 *   post:
 *     summary: Generate random activity for all clients
 *     tags: [Simulation]
 */
router.post('/pulse', simulatePulse);

export default router;
