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

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {

  Serial.begin(115200);
  delay(2000); 
  Serial.println("\n--- NEW BOOT STARTING ---");

  Serial.println("Step 1: Initializing Temperature Sensor...");
  sensors.begin();
  Serial.println("Sensors initialized!");

  Serial.println("Step 2: Initializing OLED Display...");
  Wire.begin(SDA_PIN, SCL_PIN);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED FAILED: Check wiring or I2C address!");
  }
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  Serial.println("OLED initialized!");

  Serial.println("Step 3: Turning on WiFi Radio...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nStep 4: WiFi Connected!");
}

void loop() {
  // Read temperature from the sensor
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  // Display temperature on OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Temperature: ");
  display.setCursor(0, 16);
  display.print(tempC, 2);
  display.println(" Degree Celsius");
  display.display();

  // Display temperature on Serial Monitor
  Serial.println("Temperature: ");
  Serial.println(tempC, 2);

  if (WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(FIREBASE_URL);
    http.addHeader("Content-Type", "application/json");
    unsigned long timestamp = millis();

    String payload = "{\"temperature\": " + String(tempC, 2) + 
                      ", \"timestamp\": " + String(timestamp) + "}";
    
    int httpResponseCode = http.PUT(payload);
    Serial.print("Response: ");
    Serial.println(httpResponseCode);
    http.end();
  }

  delay(5000);
}