#!/usr/bin/env python3
"""
Arduino Connection Troubleshooter
Tool untuk troubleshooting masalah koneksi Arduino umum
"""

import serial
import serial.tools.list_ports
import subprocess
import time
import sys
import os

class ArduinoTroubleshooter:
    def __init__(self):
        self.arduino_port = None
        self.flask_running = False
    
    def check_system_requirements(self):
        """Cek requirement sistem"""
        print("🔧 Checking System Requirements...")
        print("-" * 40)
        
        # Cek Python packages
        try:
            import serial
            print("✅ pyserial installed")
        except ImportError:
            print("❌ pyserial not installed - run: pip install pyserial")
            return False
        
        try:
            import flask
            print("✅ Flask installed")
        except ImportError:
            print("❌ Flask not installed - run: pip install flask")
            return False
        
        return True
    
    def check_arduino_connection(self):
        """Cek koneksi Arduino"""
        print("\n🔌 Checking Arduino Connection...")
        print("-" * 40)
        
        ports = serial.tools.list_ports.comports()
        if not ports:
            print("❌ No COM ports detected")
            return False
        
        arduino_ports = []
        for port in ports:
            desc = port.description.lower()
            if any(keyword in desc for keyword in 
                   ['arduino', 'ch340', 'cp210', 'ftdi', 'usb serial']):
                arduino_ports.append(port)
        
        if not arduino_ports:
            print("❌ No Arduino-like devices found")
            print("💡 Try:")
            print("   • Reconnect Arduino USB cable")
            print("   • Install Arduino drivers")
            print("   • Check Device Manager")
            return False
        
        print(f"✅ Found {len(arduino_ports)} Arduino device(s):")
        for port in arduino_ports:
            print(f"   • {port.device} - {port.description}")
        
        self.arduino_port = arduino_ports[0].device
        return True
    
    def test_arduino_communication(self):
        """Test komunikasi dengan Arduino"""
        if not self.arduino_port:
            return False
        
        print(f"\n📡 Testing Communication on {self.arduino_port}...")
        print("-" * 40)
        
        try:
            ser = serial.Serial(self.arduino_port, 9600, timeout=2)
            time.sleep(2)  # Arduino init time
            
            # Test ping
            ser.reset_input_buffer()
            ser.write(b"ping\n")
            ser.flush()
            time.sleep(0.5)
            
            if ser.in_waiting:
                response = ser.readline().decode().strip()
                if response == "pong":
                    print("✅ Arduino responds to ping")
                    ser.close()
                    return True
            
            # Test sensor
            ser.write(b"sensor:read\n")
            ser.flush()
            time.sleep(0.5)
            
            responses = []
            while ser.in_waiting:
                response = ser.readline().decode().strip()
                responses.append(response)
            
            if responses:
                print("✅ Arduino responds:")
                for resp in responses[:3]:  # Show first 3 responses
                    print(f"   → {resp}")
                ser.close()
                return True
            
            print("⚠️  Arduino connected but not responding")
            print("💡 Try:")
            print("   • Upload the Arduino sketch again")
            print("   • Check Arduino code for serial communication")
            print("   • Reset Arduino")
            
            ser.close()
            return False
            
        except serial.SerialException as e:
            print(f"❌ Cannot connect: {e}")
            print("💡 Try:")
            print("   • Close Arduino IDE")
            print("   • Close other applications using the port")
            print("   • Restart the computer")
            return False
    
    def check_flask_status(self):
        """Cek status Flask app"""
        print("\n🌐 Checking Flask App...")
        print("-" * 40)
        
        try:
            import requests
            response = requests.get("http://127.0.0.1:5000/status", timeout=3)
            if response.status_code == 200:
                data = response.json()
                print("✅ Flask app is running")
                print(f"   • Connected: {data.get('connected', 'unknown')}")
                print(f"   • Port: {data.get('port', 'unknown')}")
                self.flask_running = True
                return True
        except:
            pass
        
        print("❌ Flask app not responding")
        print("💡 Try:")
        print("   • Run: python app.py")
        print("   • Check port 5000 is not in use")
        return False
    
    def fix_permission_issues(self):
        """Coba perbaiki masalah permission"""
        print("\n🔒 Fixing Permission Issues...")
        print("-" * 40)
        
        if not self.arduino_port:
            return False
        
        # Coba restart app yang menggunakan port
        print("Attempting to free up COM port...")
        
        try:
            # Force close any hanging serial connections
            import psutil
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    connections = proc.info['connections']
                    if connections:
                        for conn in connections:
                            if hasattr(conn, 'laddr') and 'COM' in str(conn):
                                print(f"Found process {proc.info['name']} using COM port")
                except:
                    continue
        except ImportError:
            print("psutil not available for detailed process check")
        
        # Test again
        time.sleep(2)
        try:
            ser = serial.Serial(self.arduino_port, 9600, timeout=1)
            ser.close()
            print("✅ Port is now available")
            return True
        except:
            print("❌ Port still in use")
            return False
    
    def run_full_diagnosis(self):
        """Jalankan diagnosis lengkap"""
        print("🩺 Arduino Connection Troubleshooter")
        print("=" * 50)
        
        all_good = True
        
        # System requirements
        if not self.check_system_requirements():
            all_good = False
        
        # Arduino connection
        if not self.check_arduino_connection():
            all_good = False
        
        # Communication test
        if not self.test_arduino_communication():
            all_good = False
        
        # Flask status
        self.check_flask_status()
        
        # Summary
        print("\n📋 Diagnosis Summary")
        print("=" * 50)
        
        if all_good:
            print("🎉 All systems working correctly!")
            if self.flask_running:
                print("🌐 Open http://127.0.0.1:5000 to use the controller")
        else:
            print("⚠️  Issues found - follow suggestions above")
            print("\n🔧 Quick Fix Commands:")
            print("pip install pyserial flask requests")
            print("python app.py")
        
        return all_good

def main():
    troubleshooter = ArduinoTroubleshooter()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "scan":
            troubleshooter.check_arduino_connection()
        elif command == "test":
            troubleshooter.test_arduino_communication()
        elif command == "fix":
            troubleshooter.fix_permission_issues()
        elif command == "flask":
            troubleshooter.check_flask_status()
        else:
            print("Usage: python troubleshoot.py [scan|test|fix|flask]")
    else:
        troubleshooter.run_full_diagnosis()

if __name__ == "__main__":
    main()
