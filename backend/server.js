import express from 'express';
import mqtt from 'mqtt';
import db from './configure/db.confige.js';
import Sensor from './models/sensor.model.js';
import router from './routes/index.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// ====================== MQTT Configuration ======================
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com'; // Default: HiveMQ public broker
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'drainage/sensor-data';

// MQTT Client Options
const mqttOptions = {
  clientId: `nodejs-server_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

// Connect to MQTT Broker
const mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

// MQTT Event Handlers
mqttClient.on('connect', () => {
  console.log(`✅ MQTT Connected to: ${MQTT_BROKER_URL}`);
  
  mqttClient.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ MQTT Subscribe Error:', err);
    } else {
      console.log(`🔔 Subscribed to Topic: "${MQTT_TOPIC}" (QoS: 1)`);
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err);
});

mqttClient.on('close', () => {
  console.log('⚠️ MQTT Connection Closed');
});

mqttClient.on('reconnect', () => {
  console.log('🔃 MQTT Reconnecting...');
});

// Handle Incoming MQTT Messages
mqttClient.on('message', async (topic, message) => {
  try {
    const payload = message.toString();
    const data = JSON.parse(payload);

    console.log(`📩 MQTT Message [${topic}]:`, data);

    // console.log('💾 Sensor data saved to DB',data);
  } catch (error) {
    console.error('❌ MQTT Message Processing Error:', error);
  }
});

// ====================== Express Server Setup ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api', router);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    mqtt: mqttClient.connected ? 'connected' : 'disconnected',
  });
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  mqttClient.end();
  process.exit(0);
});

// Start Server
(async () => {
  try {
    await db(); // Initialize DB connection
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();