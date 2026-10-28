#!/usr/bin/env python3
"""
COM Port Scanner
Tool untuk scan port COM yang tersedia di sistem Windows
"""

import serial
import serial.tools.list_ports
import time

def scan_com_ports():
    """Scan dan test semua port COM yang tersedia"""
    print("🔍 Scanning COM Ports...")
    print("=" * 50)
    
    # List semua port yang terdeteksi sistem
    available_ports = serial.tools.list_ports.comports()
    
    if not available_ports:
        print("❌ Tidak ada port COM yang terdeteksi!")
        return
    
    print("📋 Port COM yang terdeteksi:")
    for port in available_ports:
        print(f"  • {port.device} - {port.description}")
    
    print("\n🧪 Testing koneksi ke setiap port...")
    print("-" * 50)
    
    for port in available_ports:
        test_port(port.device)
    
    print("\n📌 Tips Troubleshooting:")
    print("• Pastikan Arduino terhubung dan driver sudah terinstall")
    print("• Coba cabut-pasang USB Arduino")
    print("• Restart Arduino IDE atau aplikasi lain yang mungkin menggunakan port")
    print("• Periksa Device Manager di Windows untuk status driver")

def test_port(port_name):
    """Test koneksi ke port tertentu"""
    try:
        print(f"Testing {port_name}... ", end="")
        
        # Coba buka port
        ser = serial.Serial(port_name, 9600, timeout=2)
        time.sleep(2)  # Wait for Arduino to initialize
        
        # Test dengan ping command jika Arduino support
        try:
            ser.reset_input_buffer()
            ser.write(b"ping\n")
            ser.flush()
            time.sleep(0.5)
            
            if ser.in_waiting:
                response = ser.readline().decode().strip()
                if response == "pong":
                    print("✅ OK (Arduino detected)")
                    ser.close()
                    return True
            
            # Test dengan command lain
            ser.write(b"sensor:read\n")
            ser.flush()
            time.sleep(0.5)
            
            if ser.in_waiting:
                response = ser.readline().decode().strip()
                if "distance:" in response or "Arduino" in response:
                    print("✅ OK (Arduino detected)")
                    ser.close()
                    return True
        except:
            pass
        
        print("⚠️  Port terbuka tapi tidak ada respon Arduino")
        ser.close()
        return True
        
    except serial.SerialException as e:
        if "Access is denied" in str(e):
            print("❌ Port sedang digunakan aplikasi lain")
        elif "file specified" in str(e):
            print("❌ Port tidak ada")
        else:
            print(f"❌ Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def find_arduino_port():
    """Cari port Arduino yang paling mungkin"""
    print("\n🎯 Mencari Arduino...")
    
    available_ports = serial.tools.list_ports.comports()
    arduino_candidates = []
    
    for port in available_ports:
        # Cek berdasarkan deskripsi yang umum untuk Arduino
        description = port.description.lower()
        if any(keyword in description for keyword in 
               ['arduino', 'ch340', 'cp210', 'ftdi', 'usb serial']):
            arduino_candidates.append(port)
    
    if arduino_candidates:
        print("🎯 Port yang kemungkinan Arduino:")
        for port in arduino_candidates:
            print(f"  → {port.device} - {port.description}")
        return arduino_candidates[0].device
    else:
        print("❓ Tidak ditemukan port yang jelas merupakan Arduino")
        return None

if __name__ == "__main__":
    print("🚀 Arduino COM Port Scanner")
    print("=" * 50)
    
    scan_com_ports()
    arduino_port = find_arduino_port()
    
    if arduino_port:
        print(f"\n💡 Gunakan port {arduino_port} di aplikasi Flask")
    
    print("\n✨ Scan selesai!")
