import { Client, Telemetry, Incident } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

// @desc    Get all clients with pagination and filtering
// @route   GET /api/v1/clients
export const getClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'currentHealthScore',
      order = 'asc',
      riskStatus,
      planTier,
      search
    } = req.query;

    // Build cache key
    const cacheKey = `clients:${JSON.stringify(req.query)}`;
    
    // Check cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Build query
    const query = {};
    if (riskStatus) query.riskStatus = riskStatus;
    if (planTier) query.planTier = planTier;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Client.countDocuments(query)
    ]);

    const result = {
      success: true,
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheSet(cacheKey, result, 60);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single client with full details
// @route   GET /api/v1/clients/:id
export const getClient = async (req, res) => {
  try {
    const cacheKey = `client:${req.params.id}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const client = await Client.findById(req.params.id).lean();
    
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Get recent incidents
    const recentIncidents = await Incident.find({ clientId: client._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get usage summary for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageSummary = await Telemetry.aggregate([
      {
        $match: {
          clientId: client._id,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$metricType',
          total: { $sum: '$value' },
          average: { $avg: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      success: true,
      data: {
        ...client,
        recentIncidents,
        usageSummary
      }
    };

    await cacheSet(cacheKey, result, 120);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new client
// @route   POST /api/v1/clients
export const createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    await cacheDelete('clients:*');
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/v1/clients/:id
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    await cacheDelete(`client:${req.params.id}`);
    await cacheDelete('clients:*');

    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/v1/clients/:id
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Clean up related data
    await Promise.all([
      Telemetry.deleteMany({ clientId: req.params.id }),
      Incident.deleteMany({ clientId: req.params.id })
    ]);

    await cacheDelete(`client:${req.params.id}`);
    await cacheDelete('clients:*');

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get client usage data for charts
// @route   GET /api/v1/clients/:id/usage
export const getClientUsage = async (req, res) => {
  try {
    const { days = 30, metricType } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchStage = {
      clientId: new mongoose.Types.ObjectId(req.params.id),
      timestamp: { $gte: startDate }
    };

    if (metricType) {
      matchStage.metricType = metricType;
    }

    const usage = await Telemetry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            metricType: '$metricType'
          },
          total: { $sum: '$value' }
        }
      },
      { $sort: { '_id.date': 1 } },
      {
        $group: {
          _id: '$_id.metricType',
          data: {
            $push: {
              date: '$_id.date',
              value: '$total'
            }
          }
        }
      }
    ]);

    res.json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get login heatmap data
// @route   GET /api/v1/clients/:id/heatmap
export const getClientHeatmap = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(weeks) * 7));

    const heatmap = await Telemetry.aggregate([
      {
        $match: {
          clientId: new mongoose.Types.ObjectId(req.params.id),
          metricType: 'login_count',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: '$value' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: heatmap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Import mongoose for ObjectId
import mongoose from 'mongoose';
