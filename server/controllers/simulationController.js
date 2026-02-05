import { Client, Telemetry, Incident } from '../models/index.js';
import { cacheDelete } from '../config/redis.js';

// @desc    Simulate usage spike for a client
// @route   POST /api/v1/simulate/usage-spike/:clientId
export const simulateUsageSpike = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { multiplier = 3 } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Generate spike data
    const now = new Date();
    const telemetryRecords = [];
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - i);

      telemetryRecords.push({
        clientId,
        metricType: 'api_calls',
        value: Math.floor(Math.random() * 500 * multiplier) + 200,
        timestamp
      });
    }

    await Telemetry.insertMany(telemetryRecords);
    
    // Update last active
    client.lastActive = now;
    await client.save();

    await cacheDelete(`client:${clientId}`);

    res.json({
      success: true,
      message: `Generated ${telemetryRecords.length} usage records for ${client.name}`,
      data: { recordsCreated: telemetryRecords.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Simulate outage/incident for a client
// @route   POST /api/v1/simulate/outage/:clientId
export const simulateOutage = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { severity = 'High' } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Create critical incident
    const incident = await Incident.create({
      clientId,
      title: `Service Outage - ${client.name}`,
      description: 'Simulated service outage for testing purposes.',
      severity,
      status: 'Open',
      priority: severity === 'Critical' ? 1 : 2,
      tags: ['bug', 'performance']
    });

    // Reduce health score
    const healthReduction = severity === 'Critical' ? 30 : severity === 'High' ? 20 : 10;
    client.previousHealthScore = client.currentHealthScore;
    client.currentHealthScore = Math.max(0, client.currentHealthScore - healthReduction);
    await client.save();

    await cacheDelete(`client:${clientId}`);
    await cacheDelete('analytics:*');
    await cacheDelete('clients:*');

    res.json({
      success: true,
      message: `Simulated ${severity} outage for ${client.name}`,
      data: {
        incident,
        newHealthScore: client.currentHealthScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset client health to 100
// @route   POST /api/v1/simulate/reset-health/:clientId
export const resetHealth = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    client.previousHealthScore = client.currentHealthScore;
    client.currentHealthScore = 100;
    client.riskStatus = 'Healthy';
    await client.save();

    // Close all open incidents
    await Incident.updateMany(
      { clientId, status: { $in: ['Open', 'In Progress', 'Pending'] } },
      { status: 'Resolved', resolvedAt: new Date() }
    );

    await cacheDelete(`client:${clientId}`);
    await cacheDelete('analytics:*');
    await cacheDelete('clients:*');

    res.json({
      success: true,
      message: `Reset health score for ${client.name} to 100`,
      data: client
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate random activity for all clients
// @route   POST /api/v1/simulate/pulse
export const simulatePulse = async (req, res) => {
  try {
    const clients = await Client.find().select('_id name');
    const now = new Date();
    const telemetryRecords = [];
    const incidentsCreated = [];

    for (const client of clients) {
      // Random API calls
      telemetryRecords.push({
        clientId: client._id,
        metricType: 'api_calls',
        value: Math.floor(Math.random() * 200) + 50,
        timestamp: now
      });

      // Random logins
      if (Math.random() > 0.3) {
        telemetryRecords.push({
          clientId: client._id,
          metricType: 'login_count',
          value: Math.floor(Math.random() * 10) + 1,
          timestamp: now
        });
      }

      // 5% chance of incident
      if (Math.random() < 0.05) {
        const severities = ['Low', 'Medium', 'High'];
        const incident = await Incident.create({
          clientId: client._id,
          title: `Auto-generated issue - ${Date.now()}`,
          description: 'Automatically generated incident from pulse simulation.',
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'Open',
          tags: ['bug']
        });
        incidentsCreated.push({ client: client.name, incident: incident._id });
      }

      // Update last active
      await Client.findByIdAndUpdate(client._id, { lastActive: now });
    }

    await Telemetry.insertMany(telemetryRecords);

    await cacheDelete('analytics:*');
    await cacheDelete('clients:*');

    res.json({
      success: true,
      message: 'Pulse simulation complete',
      data: {
        telemetryRecords: telemetryRecords.length,
        incidentsCreated
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
