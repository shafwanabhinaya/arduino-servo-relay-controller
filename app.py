from flask import Flask, request, render_template, jsonify
import serial
import time
import atexit

app = Flask(__name__)
ser = None
initialized = False

def cleanup_serial():
    """Cleanup serial connection on app exit"""
    global ser
    if ser and ser.is_open:
        try:
            ser.close()
            print("Serial connection closed successfully")
        except:
            pass

# Register cleanup function
atexit.register(cleanup_serial)

def init_serial():
    """Initialize serial connection with retry logic"""
    global ser, initialized
    
    if ser and ser.is_open:
        return True
        
    # Close any existing connection first
    if ser:
        try:
            ser.close()
            time.sleep(0.5)  # Wait a bit before reconnecting
        except:
            pass
    
    # Try multiple COM ports
    ports_to_try = ['COM5', 'COM4', 'COM3', 'COM6', 'COM7', 'COM8']
    
    for port in ports_to_try:
        try:
            print(f"Attempting to connect to {port}...")
            ser = serial.Serial(port, 9600, timeout=1)
            time.sleep(2)  # Wait for Arduino to initialize
            
            # Test connection with ping command
            try:
                ser.reset_input_buffer()
                ser.write(b"ping\n")
                ser.flush()
                time.sleep(0.5)
                
                if ser.in_waiting:
                    response = ser.readline().decode().strip()
                    if response == "pong":
                        print(f"Successfully connected to Arduino on {port}")
                        initialized = True
                        return True
            except:
                pass
            
            # Even if ping fails, assume connection is good
            print(f"Connected to {port} (ping test failed but port opened)")
            initialized = True
            return True
            
        except serial.SerialException as e:
            print(f"Failed to connect to {port}: {e}")
            if ser:
                try:
                    ser.close()
                except:
                    pass
                ser = None
    
    print("Failed to connect to any COM port")
    initialized = False
    return False

@app.before_request
def setup_serial():
    global ser, initialized
    if not initialized:
        init_serial()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/servo', methods=['POST'])
def set_servo():
    try:
        angle = int(request.form['angle'])
        if 0 <= angle <= 180:
            # Auto-reconnect if needed
            if not (ser and ser.is_open):
                if not init_serial():
                    return jsonify({'error': 'Cannot connect to Arduino'}), 500
            
            # Clear input buffer first
            ser.reset_input_buffer()
            
            # Send command
            command = f"servo:{angle}\n"
            ser.write(command.encode())
            ser.flush()
            
            # Wait for response
            time.sleep(0.1)
            if ser.in_waiting:
                response = ser.readline().decode().strip()
                print(f"Servo response: {response}")
            
            return '', 204
        else:
            return jsonify({'error': 'Angle must be between 0 and 180'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid angle value'}), 400
    except Exception as e:
        print(f"Servo error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/relay/<state>')
def relay(state):
    try:
        if state in ['on', 'off']:
            if ser and ser.is_open:
                # Clear input buffer first
                ser.reset_input_buffer()
                
                # Send command
                command = f"relay:{state}\n"
                ser.write(command.encode())
                ser.flush()
                
                # Wait for response
                time.sleep(0.1)
                if ser.in_waiting:
                    response = ser.readline().decode().strip()
                    print(f"Relay response: {response}")
                
                return '', 204
            else:
                return jsonify({'error': 'Serial connection not available'}), 500
        else:
            return jsonify({'error': 'Invalid relay state'}), 400
    except Exception as e:
        print(f"Relay error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/status')
def status():
    try:
        connected = ser is not None and ser.is_open if ser else False
        current_port = ser.port if ser and hasattr(ser, 'port') else 'Unknown'
        
        return jsonify({
            'connected': connected,
            'port': current_port,
            'initialized': initialized,
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'connected': False,
            'port': 'Unknown',
            'error': str(e),
            'timestamp': time.time()
        })

@app.route('/radar/data')
def radar_data():
    try:
        # Auto-reconnect if needed
        if not (ser and ser.is_open):
            if not init_serial():
                return jsonify({'error': 'Cannot connect to Arduino'}), 500
        
        # Clear input buffer first
        ser.reset_input_buffer()
        
        # Request sensor data from Arduino
        ser.write(b"sensor:read\n")
        ser.flush()
        time.sleep(0.15)  # Wait a bit longer for response
        
        if ser.in_waiting:
            response = ser.readline().decode().strip()
            print(f"Radar response: {response}")
            
            if response.startswith("distance:"):
                distance = float(response.split(":")[1])
                return jsonify({
                    'distance': distance,
                    'timestamp': time.time(),
                    'status': 'ok'
                })
        
        return jsonify({
            'distance': 0,
            'timestamp': time.time(),
            'status': 'no_data'
        })
    except Exception as e:
        print(f"Radar error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/beep/control/<state>')
def beep_control(state):
    try:
        if state in ['on', 'off']:
            return jsonify({'beep_enabled': state == 'on'}), 200
        else:
            return jsonify({'error': 'Invalid beep state'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/debug/ping')
def debug_ping():
    try:
        if ser and ser.is_open:
            # Clear input buffer first
            ser.reset_input_buffer()
            
            # Send ping command
            ser.write(b"ping\n")
            ser.flush()
            time.sleep(0.1)
            
            if ser.in_waiting:
                response = ser.readline().decode().strip()
                return jsonify({
                    'sent': 'ping',
                    'received': response,
                    'status': 'ok' if response == 'pong' else 'error'
                })
            
            return jsonify({
                'sent': 'ping',
                'received': 'no_response',
                'status': 'timeout'
            })
        else:
            return jsonify({'error': 'Serial connection not available'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/debug/test')
def debug_test():
    try:
        if ser:
            # Test pin connections
            ser.write(b"test:pins\n")
            time.sleep(0.5)
            
            response = ""
            while ser.in_waiting:
                line = ser.readline().decode().strip()
                response += line + "\n"
            
            return f"<pre>{response}</pre>"
        else:
            return "Serial not connected"
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/debug/sensor')
def debug_sensor():
    try:
        if ser:
            # Test sensor multiple times
            ser.write(b"test:sensor\n")
            time.sleep(2)
            
            response = ""
            while ser.in_waiting:
                line = ser.readline().decode().strip()
                response += line + "\n"
            
            return f"<pre>{response}</pre>"
        else:
            return "Serial not connected"
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/debug/reconnect')
def debug_reconnect():
    """Force reconnect to Arduino"""
    global ser, initialized
    try:
        # Force close existing connection
        if ser:
            try:
                ser.close()
                time.sleep(1)  # Wait longer for port to be released
            except:
                pass
        
        ser = None
        initialized = False
        
        # Try to reconnect
        if init_serial():
            current_port = ser.port if ser and hasattr(ser, 'port') else 'Unknown'
            return jsonify({
                'status': 'success',
                'message': 'Reconnected to Arduino',
                'port': current_port
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to reconnect to any COM port',
                'port': 'None'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
