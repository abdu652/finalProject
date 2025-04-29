#include <WiFi.h>
#include <PubSubClient.h>

// WiFi Settings
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Settings
const char* mqtt_server = "192.168.1.100"; // Your PC's IP
const int mqtt_port = 1883;
const char* topic = "drainage/sensor-data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      Serial.println("Connected to MQTT Broker");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Example sensor data
  float waterLevel = analogRead(34) * 0.1; // Replace with actual sensor logic
  float methaneLevel = analogRead(35) * 0.1;

  String payload = "{\"water\":" + String(waterLevel) 
                 + ",\"methane\":" + String(methaneLevel) + "}";
  
  client.publish(topic, payload.c_str());
  delay(5000); // Send every 5 seconds
}