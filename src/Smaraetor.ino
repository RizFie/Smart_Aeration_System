#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define ONE_WIRE_BUS 4

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(2000);
  sensors.begin();
  Wire.begin(8, 9); // SDA, SCL
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

}

void loop() {
  sensors.requestTemperatures();

  float tempC = sensors.getTempCByIndex(0);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Temperature: ");
  display.setCursor(0, 16);
  display.print(tempC, 2);
  display.println(" Degree Celsius");
  display.display();

  delay(2000);
}