import { Client, Telemetry, Incident } from '../models/index.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import mongoose from 'mongoose';

// @desc    Get dashboard overview stats
// @route   GET /api/v1/analytics/overview
export const getOverviewStats = async (req, res) => {
  try {
    const cacheKey = 'analytics:overview';
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const [
      totalClients,
      riskDistribution,
      tierDistribution,
      avgHealthScore,
      recentAtRisk
    ] = await Promise.all([
      Client.countDocuments(),
      Client.aggregate([
        { $group: { _id: '$riskStatus', count: { $sum: 1 } } }
      ]),
      Client.aggregate([
        { $group: { _id: '$planTier', count: { $sum: 1 }, revenue: { $sum: '$contractValue' } } }
      ]),
      Client.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$currentHealthScore' } } }
      ]),
      Client.find({ riskStatus: { $in: ['At Risk', 'Critical'] } })
        .sort({ currentHealthScore: 1 })
        .limit(5)
        .select('name company currentHealthScore riskStatus planTier')
        .lean()
    ]);

    // Get 24-hour changes
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentRiskChanges = await Client.countDocuments({
      riskStatus: { $in: ['At Risk', 'Critical'] },
      updatedAt: { $gte: oneDayAgo }
    });

    const result = {
      success: true,
      data: {
        totalClients,
        averageHealthScore: avgHealthScore[0]?.avgScore?.toFixed(1) || 0,
        riskDistribution: riskDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        tierDistribution: tierDistribution.reduce((acc, item) => {
          acc[item._id] = { count: item.count, revenue: item.revenue };
          return acc;
        }, {}),
        atRiskClients: recentAtRisk,
        recentRiskChanges
      }
    };

    await cacheSet(cacheKey, result, 120);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get health score trends over time
// @route   GET /api/v1/analytics/health-trends
export const getHealthTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate API usage and login activity as proxy for health trends
    const trends = await Telemetry.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          metricType: { $in: ['api_calls', 'login_count'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            metric: '$metricType'
          },
          total: { $sum: '$value' },
          uniqueClients: { $addToSet: '$clientId' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          metric: '$_id.metric',
          total: 1,
          activeClients: { $size: '$uniqueClients' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get incident statistics
// @route   GET /api/v1/analytics/incidents
export const getIncidentStats = async (req, res) => {
  try {
    const cacheKey = 'analytics:incidents';
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      statusDistribution,
      severityDistribution,
      avgResolutionTime,
      slaBreaches,
      recentIncidents,
      incidentTrend
    ] = await Promise.all([
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: { timeToResolve: { $ne: null } } },
        { $group: { _id: null, avgTime: { $avg: '$timeToResolve' } } }
      ]),
      Incident.countDocuments({ slaBreached: true }),
      Incident.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('clientId', 'name company')
        .lean(),
      Incident.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const result = {
      success: true,
      data: {
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        severityDistribution: severityDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageResolutionTime: avgResolutionTime[0]?.avgTime?.toFixed(0) || 0,
        totalSLABreaches: slaBreaches,
        recentIncidents,
        incidentTrend
      }
    };

    await cacheSet(cacheKey, result, 120);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get platform-wide usage metrics
// @route   GET /api/v1/analytics/usage
export const getUsageMetrics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const usage = await Telemetry.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            metric: '$metricType'
          },
          total: { $sum: '$value' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          metrics: {
            $push: {
              type: '$_id.metric',
              value: '$total'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get revenue at risk calculation
// @route   GET /api/v1/analytics/revenue-risk
export const getRevenueAtRisk = async (req, res) => {
  try {
    const revenueByRisk = await Client.aggregate([
      {
        $group: {
          _id: '$riskStatus',
          totalRevenue: { $sum: '$contractValue' },
          clientCount: { $sum: 1 }
        }
      }
    ]);

    const atRiskRevenue = revenueByRisk
      .filter(r => ['At Risk', 'Critical'].includes(r._id))
      .reduce((sum, r) => sum + r.totalRevenue, 0);

    const totalRevenue = revenueByRisk
      .reduce((sum, r) => sum + r.totalRevenue, 0);

    res.json({
      success: true,
      data: {
        revenueByRisk,
        atRiskRevenue,
        totalRevenue,
        riskPercentage: ((atRiskRevenue / totalRevenue) * 100).toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
