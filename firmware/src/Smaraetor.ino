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

// --- Predictive config ---
#define WINDOW_SIZE 5           // number of readings to use for regression
#define PREDICT_SECONDS 30      // how many seconds ahead to predict
#define READING_INTERVAL 5      // seconds between readings (matches delay)
#define SLOPE_TRIGGER 0.3       // °C/reading rise rate that triggers early pump

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

bool pumpState = false;

// --- Rolling window ---
float tempWindow[WINDOW_SIZE];
int windowIndex = 0;
int windowCount = 0;

// Function to control the pump state and log the reason
void setPump(bool on, String reason) {
  if (pumpState == on) return; // no change needed, skip
  pumpState = on;
  digitalWrite(PUMP_PIN, on ? HIGH : LOW);
  Serial.println(reason);
  pushLogToFirebase(reason);
}

// Function to push temperature data to Firebase
void pushTempToFirebase(float tempC, float predictedTemp, float slope, bool pumpOn) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot push data to Firebase.");
    return;
  }

  HTTPClient http;
  http.begin(FIREBASE_URL_SENSOR);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"temperature\": " + String(tempC, 2) +
                   ", \"predictedTemp\": " + String(predictedTemp, 2) +
                   ", \"slope\": " + String(slope, 4) +
                   ", \"pumpState\": " + String(pumpOn ? "true" : "false") +
                   ", \"timestamp\": {\".sv\": \"timestamp\"}}";

  int httpResponseCode = http.PUT(payload);
  Serial.print("Sensor Response: ");
  Serial.println(httpResponseCode);
  http.end();
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

// --- Linear regression slope over the window ---
float calculateSlope() {
  if (windowCount < 2) return 0.0;

  int n = min(windowCount, WINDOW_SIZE);
  float sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (int i = 0; i < n; i++) {
    int idx = (windowIndex - n + i + WINDOW_SIZE) % WINDOW_SIZE;
    float x = i;
    float y = tempWindow[idx];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  float denom = (n * sumX2 - sumX * sumX);
  if (denom == 0) return 0.0;

  return (n * sumXY - sumX * sumY) / denom; // °C per reading
}

// --- Predict temperature N seconds ahead ---
float predictFutureTemp(float currentTemp, float slope) {
  int stepsAhead = PREDICT_SECONDS / READING_INTERVAL;
  return currentTemp + slope * stepsAhead;
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

    // --- Update rolling window ---
  tempWindow[windowIndex] = currentTemp;
  windowIndex = (windowIndex + 1) % WINDOW_SIZE;
  if (windowCount < WINDOW_SIZE) windowCount++;

    // --- Calculate slope and prediction ---
  float slope = calculateSlope();
  float predictedTemp = predictFutureTemp(currentTemp, slope);
  Serial.print("Slope: "); Serial.println(slope, 4);
  Serial.print("Predicted (30s): "); Serial.println(predictedTemp, 2);

    // --- Pump decision logic ---
  if (currentTemp >= TEMP_THRESHOLD) {
    setPump(true, "Temp above threshold. Pump activated.");
  } else if (predictedTemp >= TEMP_THRESHOLD && slope >= SLOPE_TRIGGER) {
    setPump(true, "Predictive trigger: Temp rising fast. Pump activated early.");
  } else {
    setPump(false, "Temp within normal range. Pump deactivated.");
  }

  pushTempToFirebase(currentTemp, predictedTemp, slope, pumpState);

  delay(READING_INTERVAL * 1000);
}