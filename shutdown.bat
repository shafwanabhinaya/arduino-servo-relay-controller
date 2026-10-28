@echo off
REM Safe Shutdown Script - Force close semua koneksi serial

echo.
echo ================================================================
echo    Arduino Controller - Safe Shutdown
echo ================================================================
echo.

echo 🔍 Looking for Python processes...

REM Kill any Python processes that might be using COM ports
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I /N "python.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 🛑 Stopping Python processes...
    taskkill /F /IM python.exe /T >NUL 2>&1
    timeout /t 2 >NUL
)

REM Check for Flask processes specifically
tasklist /FI "IMAGENAME eq python.exe" /FO CSV | findstr /I "flask\|app.py" >NUL
if "%ERRORLEVEL%"=="0" (
    echo 🛑 Stopping Flask applications...
    for /f "tokens=2 delims=," %%i in ('tasklist /FI "IMAGENAME eq python.exe" /FO CSV ^| findstr /I "flask\|app.py"') do (
        taskkill /F /PID %%i >NUL 2>&1
    )
)

echo 🔄 Checking COM port availability...
python -c "
import serial
import serial.tools.list_ports
ports = serial.tools.list_ports.comports()
for port in ports:
    if 'COM' in port.device:
        try:
            s = serial.Serial(port.device, timeout=1)
            s.close()
            print(f'✅ {port.device} is available')
        except:
            print(f'⚠️  {port.device} might still be in use')
" 2>NUL

echo.
echo ✅ Shutdown complete. COM ports should now be available.
echo 💡 If you still have connection issues, try:
echo    • Unplug and replug the Arduino USB cable
echo    • Restart your computer
echo    • Close Arduino IDE if it's open
echo.
pause
