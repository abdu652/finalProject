#include <WiFi.h>
#include <PubSubClient.h>

// WiFi Configuration
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Configuration
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* publish_topic = "drainage/sensor-data";
const char* subscribe_topic = "manhole/commands";
const char* status_topic = "manhole/status";

// Hardware Configuration
#define trigPin 13
#define echoPin 12
#define METHANE_PIN 34
#define BATTERY_PIN 36

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;
const unsigned long publishInterval = 5000;
unsigned long lastPublishTime = 0;

void setupWiFi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi!");
    ESP.restart();
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

bool connectToMQTT() {
  Serial.print("Attempting MQTT connection...");
  
  String clientId = "ManholeMonitor-";
  clientId += String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), status_topic, 1, true, "disconnected")) {
    Serial.println("connected");
    
    // Publish connection status
    mqttClient.publish(status_topic, "connected", true);
    
    // Subscribe to commands
    if (mqttClient.subscribe(subscribe_topic)) {
      Serial.print("Subscribed to ");
      Serial.println(subscribe_topic);
      return true;
    }
    Serial.println("Subscribe failed!");
  } else {
    Serial.print("failed, rc=");
    Serial.println(mqttClient.state());
  }
  return false;
}

void publishSensorData() {
  if (!mqttClient.connected()) {
    Serial.println("Not connected, skipping publish");
    return;
  }

  // Test publish
  if (!mqttClient.publish("manhole/test", "test")) {
    Serial.println("Test publish failed!");
    return;
  }

  // Simulated sensor readings
  float sewageLevel = 10.5 + random(-5, 5) / 10.0;
  float methaneLevel = random(200, 600);
  float batteryLevel = random(80, 100);

  // Create JSON payload
  String payload = "{";
  payload += "\"sewage\":" + String(sewageLevel, 1) + ",";
  payload += "\"methane\":" + String(methaneLevel, 0) + ",";
  payload += "\"battery\":" + String(batteryLevel, 0);
  payload += "}";

  // Publish correctly (cast payload to const uint8_t* and use payload length)
  if (mqttClient.publish(publish_topic, (const uint8_t*)payload.c_str(), payload.length(), false)) {
    Serial.print("Published: ");
    Serial.println(payload);
  } else {
    Serial.println("Publish failed!");
    Serial.print("MQTT state: ");
    Serial.println(mqttClient.state());
  }
}

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));

  // Initialize hardware
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(METHANE_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  setupWiFi();

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);
}

void loop() {
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > reconnectInterval) {
      lastReconnectAttempt = now;
      if (connectToMQTT()) {
        lastReconnectAttempt = 0;
      }
    }
  } else {
    if (millis() - lastPublishTime > publishInterval) {
      lastPublishTime = millis();
      publishSensorData();
    }
  }

  mqttClient.loop();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    setupWiFi();
  }
}
