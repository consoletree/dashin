import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientUsage,
  getClientHeatmap
} from '../controllers/clientController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - company
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Client contact name
 *         email:
 *           type: string
 *           format: email
 *         company:
 *           type: string
 *         planTier:
 *           type: string
 *           enum: [Bronze, Silver, Gold, Enterprise]
 *         currentHealthScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         riskStatus:
 *           type: string
 *           enum: [Healthy, At Risk, Critical, Churned]
 *         integrations:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/clients:
 *   get:
 *     summary: Get all clients with pagination
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *       - in: query
 *         name: riskStatus
 *         schema:
 *           type: string
 *         description: Filter by risk status
 *       - in: query
 *         name: planTier
 *         schema:
 *           type: string
 *         description: Filter by plan tier
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/', getClients);

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   get:
 *     summary: Get single client with details
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /api/v1/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created
 */
router.post('/', createClient);

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
 */
router.put('/:id', updateClient);

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   delete:
 *     summary: Delete a client
 *     tags: [Clients]
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /api/v1/clients/{id}/usage:
 *   get:
 *     summary: Get client usage data for charts
 *     tags: [Clients]
 */
router.get('/:id/usage', getClientUsage);

/**
 * @swagger
 * /api/v1/clients/{id}/heatmap:
 *   get:
 *     summary: Get client login heatmap data
 *     tags: [Clients]
 */
router.get('/:id/heatmap', getClientHeatmap);

export default router;
