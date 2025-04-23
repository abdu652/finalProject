import mongoose from 'mongoose';
import SensorReading from '../models/sensorReading.model.js';
import Manhole from '../models/manhole.model.js';

// Helper to check threshold violations
const checkThresholds = (reading, thresholds) => {
  const alerts = [];
  const { sewageLevel, methaneLevel, flowRate } = reading;
  const { maxDistance, maxGas, minFlow } = thresholds;

  if (sewageLevel > maxDistance) alerts.push('high_sewage');
  if (methaneLevel > maxGas) alerts.push('gas_leak');
  if (flowRate < minFlow) alerts.push('blockage_risk');

  return alerts.length > 0 ? alerts : null;
};

// 1. Create New Sensor Reading
const createReading = async (req, res) => {
  try {
    const { manholeId, sensors, thresholds, lastCalibration } = req.body;

    // Validate required fields
    if (!manholeId || !sensors) {
      return res.status(400).json({
        success: false,
        message: 'Manhole ID and sensor data are required'
      });
    }

    // Verify manhole exists
    const manhole = await Manhole.findById(manholeId);
    if (!manhole) {
      return res.status(404).json({
        success: false,
        message: 'Manhole not found'
      });
    }

    // Check for alerts
    const alertTypes = checkThresholds(sensors, thresholds || {}) || [];
    const status = alertTypes.length > 0 
      ? alertTypes.includes('gas_leak') ? 'critical' : 'warning'
      : 'normal';

    // Create reading
    const newReading = new SensorReading({
      manholeId,
      sensors,
      thresholds: thresholds || {
        maxDistance: 2.5,  // Default thresholds (meters)
        maxGas: 1000,      // ppm
        minFlow: 0.1       // m/s
      },
      lastCalibration,
      status,
      alertTypes
    });

    await newReading.save();

    // Update manhole last inspection if critical
    if (status === 'critical') {
      await Manhole.findByIdAndUpdate(manholeId, {
        lastInspection: Date.now(),
        status: 'needs_attention'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Reading recorded',
      data: newReading
    });

  } catch (error) {
    console.error('Create reading error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// 2. Get Readings by Manhole
const getReadingsByManhole = async (req, res) => {
  try {
    const { manholeId } = req.params;
    const { limit = 100, timeRange } = req.query;

    let query = { manholeId };
    
    if (timeRange) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(timeRange));
      query.timestamp = { $gte: hoursAgo };
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings
    });

  } catch (error) {
    console.error('Get readings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// 3. Get Critical Alerts
const getCriticalReadings = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({
      status: 'critical',
      timestamp: { $gte: timeThreshold }
    }).populate('manholeId', 'code location');

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// 4. Sensor Data Analytics
const getSensorAnalytics = async (req, res) => {
  try {
    const { manholeId, metric, period = '24h' } = req.query;
    
    // Calculate time range
    const range = period.endsWith('h') 
      ? parseInt(period) * 60 * 60 * 1000 
      : parseInt(period) * 24 * 60 * 60 * 1000;
    
    const timeThreshold = new Date(Date.now() - range);

    // Build query
    const match = { timestamp: { $gte: timeThreshold } };
    if (manholeId) match.manholeId = manholeId;

    // Group by time interval
    const interval = range <= 86400000 ? 'hour' : 'day'; // <=24h? hourly : daily
    
    const results = await SensorReading.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            [interval]: { $hour: '$timestamp' },
            ...(interval === 'day' && { day: { $dayOfMonth: '$timestamp' } })
          },
          avgValue: { $avg: `$sensors.${metric}` },
          maxValue: { $max: `$sensors.${metric}` },
          minValue: { $min: `$sensors.${metric}` }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export {
  createReading,
  getReadingsByManhole,
  getCriticalReadings,
  getSensorAnalytics
};

// Get last 50 readings from past 6 hours
// GET /readings/manhole/:manholeId?limit=50&timeRange=6
// Get all critical alerts from past 48 hours
// GET /readings/alerts?hours=48
// Get daily average temperature for specific manhole
// GET /readings/analytics?manholeId=123&metric=temperature&period=7d