import express from 'express';
import mqtt from 'mqtt';
import db from './configure/db.confige.js';
import router from './routes/index.js';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => console.log('User disconnected'));
});

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'drainage/sensor-data';

const mqttOptions = {
  clientId: `nodejs-server_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

const mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

mqttClient.on('connect', () => {
  console.log(`MQTT Connected to: ${MQTT_BROKER_URL}`);
  mqttClient.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
    if (err) console.error('MQTT Subscribe Error:', err);
    else console.log(`Subscribed to Topic: "${MQTT_TOPIC}"`);
  });
});

mqttClient.on('error', (err) => console.error('MQTT Connection Error:', err));
mqttClient.on('close', () => console.log('MQTT Connection Closed'));
mqttClient.on('reconnect', () => console.log('MQTT Reconnecting...'));

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Received message on topic "${topic}":`, data);
    io.emit('sensorData', data);
  } catch (error) {
    console.error('MQTT Message Processing Error:', error);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api', router);
app.get('/health', (req, res) => res.status(200).json({
  status: 'healthy',
  mqtt: mqttClient.connected ? 'connected' : 'disconnected',
}));
app.use('api',router);
process.on('SIGINT', () => {
  mqttClient.end();
  process.exit(0);
});

(async () => {
  try {
    await db();
    httpServer.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();