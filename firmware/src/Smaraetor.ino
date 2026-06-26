#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "secrets.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define ONE_WIRE_BUS 4
#define SDA_PIN 21
#define SCL_PIN 22
#define PUMP_PIN 25
#define TEMP_THRESHOLD 35.0

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

bool pumpState = false;

// Function to control the pump state and log the reason
void setPump(bool on, String reason) {
  if (pumpState == on) return; // no change needed, skip
  pumpState = on;
  digitalWrite(PUMP_PIN, on ? HIGH : LOW);
  Serial.println(reason);
  pushLogToFirebase(reason);
}

// Function to push temperature data to Firebase
void pushTempToFirebase(float tempC) {
  if (WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(FIREBASE_URL_SENSOR);
    http.addHeader("Content-Type", "application/json");

   String payload = "{\"temperature\": " + String(tempC, 2) + 
                     ", \"timestamp\": {\".sv\": \"timestamp\"}}";
    
    int httpResponseCode = http.PUT(payload);
    Serial.print("Response: ");
    Serial.println(httpResponseCode);
    http.end();
  } else if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot push data to Firebase.");
    return;
  }
}

void pushLogToFirebase(String logMessage){
  if (WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(FIREBASE_URL_LOGS);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"log\": \"" + logMessage + 
                     "\", \"timestamp\": {\".sv\": \"timestamp\"}}";
    
    int LoghttpResponseCode = http.POST(payload);
    Serial.print("Log Response: ");
    Serial.println(LoghttpResponseCode);
    http.end();
  } else if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot push log to Firebase.");
    return;
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n--- SMARAETOR BOOTING ---");

  // Initialize the pump pin
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);  // pump OFF on boot
  Serial.println("Step 1: Pump pin initialized (OFF)");

  // Initialize the temperature sensor
  sensors.begin();
  Serial.println("Step 2: Temperature sensor initialized");

  // Initialize the OLED display
  Wire.begin(SDA_PIN, SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED FAILED: Check wiring or I2C address!");
  }
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  Serial.println("Step 3: OLED initialized");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Step 4: Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  // Read temperature from the sensor
  sensors.requestTemperatures();
  float currentTemp = sensors.getTempCByIndex(0);

  // Display temperature on Serial Monitor
  Serial.println("Temperature: ");
  Serial.println(currentTemp, 2);

  pushTempToFirebase(currentTemp);

  if (currentTemp >= TEMP_THRESHOLD) {
    setPump(true, "Temperature above the threshold. Pump activated.");
  } else {
    setPump(false, "Temperature within normal range. Pump deactivated.");
  }

  delay(5000);
}