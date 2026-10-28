# 🎛️ Arduino Servo Relay Controller

Aplikasi web modern untuk mengontrol servo motor, relay, dan radar HC-SR04 dengan Arduino. Dilengkapi fitur beep sensor parkir dan troubleshooting tools.

## ✨ Fitur

### 🎯 Kontrol Utama
- **Servo Motor**: Kontrol sudut 0-180° dengan slider interaktif
- **Relay**: Kontrol ON/OFF dengan tombol visual
- **Radar HC-SR04**: Monitoring jarak real-time dengan visualisasi radar
- **Beep Sensor**: Suara peringatan seperti sensor parkir mobil

### 🔧 Troubleshooting
- **Auto-Reconnect**: Otomatis menyambung ulang jika koneksi terputus
- **Multi-Port Detection**: Scan multiple COM ports (COM3-COM8)
- **Debug Tools**: Ping test, sensor test, connection status
- **Visual Status**: Real-time monitoring koneksi dan port

### 🌐 Interface
- **Modern UI**: Design responsif dengan grid layout
- **Real-time Updates**: Data radar dan status update otomatis
- **Keyboard Shortcuts**: Arrow keys untuk servo, 1/0 untuk relay, B untuk beep
- **Visual Feedback**: Animasi dan status indicator

## 🚀 Quick Start

### Opsi 1: Menggunakan Script (Recommended)
```bash
# Double-click file start.bat atau jalankan di Command Prompt
start.bat
```

### Opsi 2: Manual Setup
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Upload Arduino sketch
# Upload file controll.ino ke Arduino menggunakan Arduino IDE

# 3. Jalankan aplikasi
python app.py

# 4. Buka browser
# http://127.0.0.1:5000
```

## 🔌 Hardware Setup

### Koneksi Arduino
```
Servo Motor:
- VCC -> 5V
- GND -> GND  
- Signal -> Pin 9

Relay:
- VCC -> 5V
- GND -> GND
- IN -> Pin 12

HC-SR04 Radar:
- VCC -> 5V
- GND -> GND
- Trig -> Pin 6
- Echo -> Pin 7
```

### ⚡ Power Supply
- **USB Power**: OK untuk testing ringan
- **External 12V 2A**: Recommended untuk operasi stabil
- **Pastikan ground tersambung** jika menggunakan power eksternal

## 🛠️ Troubleshooting

### ❌ Masalah: "Cannot connect to Arduino"

**Quick Fix:**
```bash
# Jalankan troubleshooter
python troubleshoot.py

# Atau coba reconnect via web interface
# Klik tombol "🔄 Reconnect" di bagian Troubleshooting
```

**Manual Steps:**
1. **Cek koneksi fisik**:
   - Pastikan kabel USB tersambung
   - Coba cabut-pasang USB Arduino
   - Ganti kabel USB jika perlu

2. **Cek COM port**:
   ```bash
   python com_port_scanner.py
   ```

3. **Close aplikasi yang menggunakan port**:
   - Tutup Arduino IDE
   - Tutup Serial Monitor
   - Restart aplikasi Flask

4. **Restart system**:
   ```bash
   shutdown.bat  # Safe shutdown
   start.bat     # Restart application
   ```

### ❌ Masalah: "Permission Error (Access Denied)"

**Penyebab**: Port COM sedang digunakan aplikasi lain

**Solusi**:
```bash
# 1. Safe shutdown
shutdown.bat

# 2. Wait 5 seconds, then restart
start.bat
```

### ❌ Masalah: "Radar stuck at 400cm" 

**Penyebab**: Pin conflict atau koneksi tidak stabil

**Solusi**:
1. **Cek koneksi HC-SR04**:
   - Trig -> Pin 6 (bukan pin 13!)
   - Echo -> Pin 7
   - Power supply stable

2. **Test sensor**:
   ```bash
   # Via web interface, klik "🧪 Sensor Test"
   # Atau via command line:
   python troubleshoot.py test
   ```

### ❌ Masalah: "Servo/Relay tidak responsif"

**Solusi**:
1. **Cek power supply**:
   - Gunakan external 12V 2A jika memungkinkan
   - Pastikan ground tersambung

2. **Test via debug**:
   - Buka web interface
   - Klik "📡 Ping Test" untuk test komunikasi
   - Lihat response di troubleshoot log

## 📡 API Endpoints

### Control Endpoints
- `POST /servo` - Set servo angle (0-180°)
- `GET /relay/<state>` - Set relay ON/OFF
- `GET /radar/data` - Get distance data
- `GET /beep/control/<state>` - Enable/disable beep

### Debug Endpoints  
- `GET /status` - Connection status dan port info
- `GET /debug/ping` - Test Arduino communication
- `GET /debug/test` - Test pin connections
- `GET /debug/sensor` - Test sensor readings
- `GET /debug/reconnect` - Force reconnect

## 🎮 Keyboard Controls

- **← →**: Servo angle -10°/+10°
- **1**: Relay ON
- **0**: Relay OFF  
- **B**: Toggle Beep ON/OFF

## 📁 File Structure

```
servo_relay_controller/
├── app.py                 # Flask backend dengan auto-reconnect
├── controll.ino          # Arduino sketch
├── requirements.txt      # Python dependencies
├── com_port_scanner.py   # Tool scan COM ports
├── troubleshoot.py       # Diagnostic tool
├── start.bat            # Quick start script
├── shutdown.bat         # Safe shutdown script
├── templates/
│   └── index.html       # Web interface
├── static/
│   ├── css/
│   │   └── style.css    # Modern styling
│   └── js/
│       └── script.js    # Interactive controls
└── README.md           # Documentation
```

## 🔊 Beep Feature

Fitur beep menggunakan Web Audio API untuk simulasi sensor parkir:

- **Jarak 5-100cm**: Beep aktif
- **Semakin dekat**: Beep semakin cepat
- **Di atas 100cm**: Tidak ada beep
- **Toggle**: Bisa dimatikan/dinyalakan

## 🌐 Web Interface Features

### Dashboard Modern
- **Grid Layout**: 4 kolom responsif (Servo, Radar, Relay, Troubleshooting)
- **Real-time Data**: Update setiap 200ms
- **Visual Radar**: Animasi sweep dengan blip target
- **Status Indicators**: Color-coded connection status

### Troubleshooting Panel
- **Connection Details**: Port, status, last update
- **Action Buttons**: Reconnect, ping test, sensor test
- **Live Log**: Terminal-style troubleshooting log
- **Auto-Update**: Status refresh setiap 5 detik

## 🛡️ Error Handling

- **Auto-Reconnect**: Otomatis coba reconnect jika disconnect
- **Multi-Port Scan**: Scan COM3-COM8 untuk find Arduino
- **Graceful Degradation**: UI tetap berfungsi meski Arduino disconnect
- **Serial Buffer Management**: Clear buffer untuk avoid data corruption

## 💡 Tips Optimasi

1. **Performance**:
   - Gunakan external power supply untuk stability
   - Close unnecessary applications
   - Monitor system resources

2. **Reliability**:
   - Regular restart aplikasi untuk clear memory
   - Use shortest USB cable possible
   - Avoid USB hubs if possible

3. **Development**:
   - Use troubleshoot.py untuk debug
   - Monitor Flask debug output
   - Check Arduino Serial Monitor untuk hardware issues

## 📞 Support

Jika masih ada masalah:

1. **Jalankan full diagnostic**:
   ```bash
   python troubleshoot.py
   ```

2. **Check system info**:
   ```bash
   python com_port_scanner.py
   ```

3. **Safe restart**:
   ```bash
   shutdown.bat
   start.bat
   ```

---

**✨ Project Status**: Semua fitur utama sudah stabil dan berjalan optimal! 

**🎯 Hardware Requirements**: Arduino Uno/Nano + Servo + Relay + HC-SR04 + Power Supply

**🌐 Tested On**: Windows 10/11, Python 3.8+, Arduino IDE 1.8+
