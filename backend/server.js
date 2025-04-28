import express from 'express';
import mqtt from 'mqtt';
import db from './configure/db.confige.js';
import SensorReading from './models/sensorReading.model.js';

const app = express();
const port = 5000;

// MQTT Configuration
const mqttBroker = 'mqtt://broker.hivemq.com'; // Use your broker URL
const topic = 'drainage/sensor-data';

// Connect to MQTT Broker
const client = mqtt.connect(mqttBroker);

client.on('connect', () => {
  console.log('Connected to MQTT Broker');
  client.subscribe(topic);
});

// Handle incoming MQTT messages
client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    await SensorReading.create({
      deviceId: data.deviceId,
      waterLevel: data.waterLevel,
      methaneLevel: data.methaneLevel,
      timestamp: new Date()
    });
    
    console.log('Data saved:', data);
  } catch (error) {
    console.error('Error processing MQTT data:', error);
  }
});

// Start server
(async () => {
  await db();
  app.listen(port, () => {
    console.log(`Server and MQTT listener running on port ${port}`);
  });
})();