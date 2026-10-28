#include <Servo.h>

Servo myservo;
int relayPin = 8;
int trigPin = 6;   // Pin Trigger HC-SR04 (pin yang aman)
int echoPin = 7;   // Pin Echo HC-SR04 (pin yang aman)
int pos = 0;
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 100; // Read sensor every 100ms

void setup() {
  Serial.begin(9600);
  myservo.attach(9); // pin servo
  pinMode(relayPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(relayPin, LOW);
  
  // Initialize servo to center position
  myservo.write(90);
  delay(500);
  
  Serial.println("Arduino Ready");
}

void loop() {
  // Handle serial commands dengan timeout yang lebih baik
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.startsWith("servo:")) {
      int angle = cmd.substring(6).toInt();
      angle = constrain(angle, 0, 180);
      myservo.write(angle);
      delay(15); // Small delay untuk servo movement
      Serial.print("servo_ok:");
      Serial.println(angle);
    }
    else if (cmd == "relay:on") {
      digitalWrite(relayPin, HIGH);
      Serial.println("relay_ok:on");
    }
    else if (cmd == "relay:off") {
      digitalWrite(relayPin, LOW);
      Serial.println("relay_ok:off");
    }
    else if (cmd == "sensor:read") {
      float distance = readUltrasonicDistance();
      Serial.print("distance:");
      Serial.println(distance);
    }
    else if (cmd == "ping") {
      Serial.println("pong");
    }
    else if (cmd == "status") {
      Serial.println("arduino_ready");
      Serial.print("trig_pin:");
      Serial.println(trigPin);
      Serial.print("echo_pin:");
      Serial.println(echoPin);
      Serial.print("relay_pin:");
      Serial.println(relayPin);
    }
  }
  
  delay(10); // Small delay untuk stabilitas
}

float readUltrasonicDistance() {
  // Clear trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(10);
  
  // Send 10 microsecond pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read echo pin dengan timeout
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return 50; // Return reasonable default jika no echo
  }
  
  float distance = (duration * 0.034) / 2; // Convert to cm
  
  // Limit distance reading to reasonable range
  if (distance > 400) distance = 400;
  if (distance < 2) distance = 2;
  
  return distance;
}
