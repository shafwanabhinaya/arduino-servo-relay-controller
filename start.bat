@echo off
REM Quick Start Script untuk Arduino Servo Relay Controller
REM Jalankan script ini jika ada masalah koneksi

echo.
echo ================================================================
echo    Arduino Servo Relay Controller - Quick Start
echo ================================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python tidak ditemukan! Install Python terlebih dahulu.
    pause
    exit /b 1
)

echo ✅ Python detected

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📋 Installing requirements...
pip install -r requirements.txt

REM Run troubleshooter first
echo.
echo 🩺 Running Arduino diagnostic...
python troubleshoot.py scan

echo.
echo 🚀 Starting Flask application...
echo.
echo ================================================================
echo  Application will start on: http://127.0.0.1:5000
echo  Press Ctrl+C to stop the application
echo ================================================================
echo.

REM Start the application
python app.py

echo.
echo 👋 Application stopped. Press any key to exit.
pause >nul
