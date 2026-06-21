#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

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

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
// Keep the brownout disabled for this test
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(2000); 
  Serial.println("\n--- NEW BOOT STARTING ---");

  Serial.println("Step 1: Initializing Temperature Sensor...");
  sensors.begin();
  Serial.println("Sensors initialized!");

  Serial.println("Step 2: Initializing OLED Display...");
  // If the log stops right here, your I2C pins are wrong and it's hanging!
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  Serial.println("OLED initialized!");

  Serial.println("Step 3: Turning on WiFi Radio...");
  // If the log stops right here, it's definitively a raw power drop killing the CPU
  WiFi.mode(WIFI_STA); // Forces Station mode, preventing it from wasting power looking for Access Point connections
  WiFi.setTxPower(WIFI_POWER_8_5dBm); // Throttles the radio transmit power to prevent the massive current spike
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