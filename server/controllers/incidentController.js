import { Incident, Client } from '../models/index.js';
import { cacheDelete } from '../config/redis.js';

// @desc    Get all incidents with filtering
// @route   GET /api/v1/incidents
export const getIncidents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      clientId,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (clientId) query.clientId = clientId;

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .populate('clientId', 'name company planTier')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Incident.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single incident
// @route   GET /api/v1/incidents/:id
export const getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('clientId', 'name company email planTier accountManager')
      .lean();

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new incident
// @route   POST /api/v1/incidents
export const createIncident = async (req, res) => {
  try {
    // Verify client exists
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const incident = await Incident.create(req.body);
    await cacheDelete('analytics:incidents');

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update incident
// @route   PUT /api/v1/incidents/:id
export const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    await cacheDelete('analytics:incidents');
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete incident
// @route   DELETE /api/v1/incidents/:id
export const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    await cacheDelete('analytics:incidents');
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add communication to incident
// @route   POST /api/v1/incidents/:id/communications
export const addCommunication = async (req, res) => {
  try {
    const { message, sender } = req.body;
    
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          communications: { message, sender, sentAt: new Date() }
        }
      },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
