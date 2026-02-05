import express from 'express';
import {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  addCommunication
} from '../controllers/incidentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: Get all incidents with filtering
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, In Progress, Pending, Resolved, Closed]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 */
router.get('/', getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get single incident
 *     tags: [Incidents]
 */
router.get('/:id', getIncident);

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Create new incident
 *     tags: [Incidents]
 */
router.post('/', createIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   put:
 *     summary: Update incident
 *     tags: [Incidents]
 */
router.put('/:id', updateIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   delete:
 *     summary: Delete incident
 *     tags: [Incidents]
 */
router.delete('/:id', deleteIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/communications:
 *   post:
 *     summary: Add communication to incident
 *     tags: [Incidents]
 */
router.post('/:id/communications', addCommunication);

export default router;
