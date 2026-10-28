class BeepController {
    constructor() {
        this.isEnabled = true;
        this.audioContext = null;
        this.beepInterval = null;
        this.currentDistance = 0;
        this.maxDistance = 100; // cm - jarak maksimum untuk beep
        this.minDistance = 5;   // cm - jarak minimum untuk beep
        this.isBeeping = false;
        this.initAudio();
    }

    initAudio() {
        try {
            // Inisialisasi Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context tidak tersedia:', error);
        }
    }

    enable() {
        this.isEnabled = true;
        console.log('Beep diaktifkan');
    }

    disable() {
        this.isEnabled = false;
        this.stopBeep();
        console.log('Beep dinonaktifkan');
    }

    updateDistance(distance) {
        this.currentDistance = distance;
        
        if (!this.isEnabled || !this.audioContext) return;
        
        // Hitung interval beep berdasarkan jarak
        if (distance <= this.maxDistance && distance >= this.minDistance) {
            const interval = this.calculateBeepInterval(distance);
            this.startBeep(interval);
        } else {
            this.stopBeep();
        }
    }

    calculateBeepInterval(distance) {
        // Semakin dekat, semakin cepat beep
        // Jarak 5cm = 100ms, Jarak 100cm = 2000ms
        const minInterval = 100;  // ms - beep tercepat
        const maxInterval = 2000; // ms - beep terlambat
        
        // Normalisasi jarak ke range 0-1
        const normalizedDistance = (distance - this.minDistance) / (this.maxDistance - this.minDistance);
        
        // Hitung interval (terbalik - makin dekat makin cepat)
        const interval = minInterval + (maxInterval - minInterval) * normalizedDistance;
        
        return Math.max(minInterval, Math.min(maxInterval, interval));
    }

    startBeep(interval) {
        // Jika interval berubah, restart beep dengan interval baru
        if (this.beepInterval && this.currentInterval !== interval) {
            this.stopBeep();
        }
        
        if (!this.beepInterval) {
            this.currentInterval = interval;
            this.playBeep(); // Beep pertama langsung
            
            this.beepInterval = setInterval(() => {
                this.playBeep();
            }, interval);
        }
    }

    stopBeep() {
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
            this.currentInterval = null;
        }
    }

    playBeep() {
        if (!this.audioContext || !this.isEnabled) return;
        
        try {
            // Resume audio context jika suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Buat oscillator untuk tone beep
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Koneksi audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Konfigurasi suara beep
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz tone
            oscillator.type = 'square'; // Suara beep yang khas
            
            // Envelope untuk beep yang pendek dan tajam
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // Decay
            
            // Mainkan beep
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            
            // Cleanup
            oscillator.addEventListener('ended', () => {
                oscillator.disconnect();
                gainNode.disconnect();
            });
            
        } catch (error) {
            console.warn('Error playing beep:', error);
        }
    }

    // Method untuk test beep
    testBeep() {
        this.playBeep();
    }
}

class RadarController {
    constructor() {
        this.currentDistance = 0;
        this.maxDistance = 200; // cm
        this.minDistance = 2;   // cm
        this.isActive = false;
        this.updateInterval = null;
        this.distanceHistory = [];
        this.maxHistoryLength = 10;
        this.beepController = new BeepController();
    }

    start() {
        this.isActive = true;
        this.updateInterval = setInterval(() => {
            this.fetchRadarData();
        }, 500); // Update setiap 500ms
        
        console.log('Radar dimulai');
    }

    stop() {
        this.isActive = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.beepController.stopBeep();
        console.log('Radar dihentikan');
    }

    async fetchRadarData() {
        try {
            const response = await fetch('/radar/data');
            const data = await response.json();
            
            if (data.distance !== undefined) {
                this.updateDistance(data.distance);
            }
        } catch (error) {
            console.error('Error fetching radar data:', error);
        }
    }

    updateDistance(distance) {
        this.currentDistance = distance;
        
        // Update history
        this.distanceHistory.push(distance);
        if (this.distanceHistory.length > this.maxHistoryLength) {
            this.distanceHistory.shift();
        }

        // Update display
        this.updateDistanceDisplay();
        this.updateRadarBlip();
        this.updateStats();
        
        // Update beep berdasarkan jarak
        this.beepController.updateDistance(distance);
    }

    updateDistanceDisplay() {
        const displayElement = document.getElementById('radarDistance');
        if (displayElement) {
            displayElement.textContent = `${this.currentDistance.toFixed(1)} cm`;
            
            // Change color based on distance
            const element = displayElement.parentElement;
            if (this.currentDistance < 10) {
                element.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            } else if (this.currentDistance < 30) {
                element.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            } else {
                element.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            }
        }
    }

    updateRadarBlip() {
        const blipElement = document.getElementById('radarBlip');
        if (blipElement) {
            // Calculate position on radar (distance from center)
            const maxRadius = 90; // pixels from center (disesuaikan untuk radar yang lebih kecil)
            const distanceRatio = Math.min(this.currentDistance / this.maxDistance, 1);
            const radius = distanceRatio * maxRadius;
            
            // Random angle for visual effect (in real implementation, this would be servo angle)
            const angle = (Date.now() / 50) % 360; // Rotating effect
            const angleRad = (angle * Math.PI) / 180;
            
            const centerX = 100; // center of radar (disesuaikan)
            const centerY = 100;
            
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);
            
            blipElement.style.left = `${x}px`;
            blipElement.style.top = `${y}px`;
            
            // Hide blip if distance is out of range
            if (this.currentDistance > this.maxDistance || this.currentDistance < this.minDistance) {
                blipElement.style.display = 'none';
            } else {
                blipElement.style.display = 'block';
            }
        }
    }

    updateStats() {
        // Update minimum distance
        const minElement = document.getElementById('minDistance');
        if (minElement && this.distanceHistory.length > 0) {
            const min = Math.min(...this.distanceHistory);
            minElement.textContent = `${min.toFixed(1)} cm`;
        }

        // Update maximum distance
        const maxElement = document.getElementById('maxDistance');
        if (maxElement && this.distanceHistory.length > 0) {
            const max = Math.max(...this.distanceHistory);
            maxElement.textContent = `${max.toFixed(1)} cm`;
        }

        // Update average distance
        const avgElement = document.getElementById('avgDistance');
        if (avgElement && this.distanceHistory.length > 0) {
            const avg = this.distanceHistory.reduce((a, b) => a + b, 0) / this.distanceHistory.length;
            avgElement.textContent = `${avg.toFixed(1)} cm`;
        }

        // Update status
        const statusElement = document.getElementById('radarStatus');
        if (statusElement) {
            if (this.currentDistance < this.minDistance) {
                statusElement.textContent = 'Terlalu Dekat';
                statusElement.style.color = '#f44336';
            } else if (this.currentDistance > this.maxDistance) {
                statusElement.textContent = 'Di luar Jangkauan';
                statusElement.style.color = '#ff9800';
            } else {
                statusElement.textContent = 'Normal';
                statusElement.style.color = '#4CAF50';
            }
        }
    }

    toggleBeep() {
        if (this.beepController.isEnabled) {
            this.beepController.disable();
        } else {
            this.beepController.enable();
        }
        return this.beepController.isEnabled;
    }
}

class ServoRelayController {
    constructor() {
        this.currentAngle = 90;
        this.relayState = 'off';
        this.isConnected = false;
        this.radar = new RadarController();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAngleDisplay();
        this.checkConnection();
        
        // Initialize servo to center position
        this.setServoAngle(90);
        
        // Start radar
        this.radar.start();
    }

    setupEventListeners() {
        const servoSlider = document.getElementById('servoRange');
        const relayOnBtn = document.getElementById('relayOnBtn');
        const relayOffBtn = document.getElementById('relayOffBtn');
        const beepToggleBtn = document.getElementById('beepToggleBtn');

        if (servoSlider) {
            servoSlider.addEventListener('input', (e) => {
                this.currentAngle = parseInt(e.target.value);
                this.updateAngleDisplay();
                this.setServoAngle(this.currentAngle);
            });
        }

        if (relayOnBtn) {
            relayOnBtn.addEventListener('click', () => {
                this.setRelay('on');
            });
        }

        if (relayOffBtn) {
            relayOffBtn.addEventListener('click', () => {
                this.setRelay('off');
            });
        }

        if (beepToggleBtn) {
            beepToggleBtn.addEventListener('click', () => {
                const isEnabled = this.radar.toggleBeep();
                beepToggleBtn.textContent = isEnabled ? '🔊 BEEP ON' : '🔇 BEEP OFF';
                beepToggleBtn.className = isEnabled ? 'beep-btn on' : 'beep-btn off';
            });
        }
    }

    updateAngleDisplay() {
        const angleDisplay = document.getElementById('angleDisplay');
        if (angleDisplay) {
            angleDisplay.textContent = `${this.currentAngle}°`;
        }
    }

    async setServoAngle(angle) {
        try {
            this.showLoading('servo');
            
            const response = await fetch('/servo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `angle=${angle}`
            });

            if (response.ok) {
                this.showSuccess('servo');
                this.updateConnectionStatus(true);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error setting servo angle:', error);
            this.showError('servo');
            this.updateConnectionStatus(false);
        }
    }

    async setRelay(state) {
        try {
            this.showLoading('relay');
            
            const response = await fetch(`/relay/${state}`);
            
            if (response.ok) {
                this.relayState = state;
                this.updateRelayButtons();
                this.showSuccess('relay');
                this.updateConnectionStatus(true);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error setting relay state:', error);
            this.showError('relay');
            this.updateConnectionStatus(false);
        }
    }

    updateRelayButtons() {
        const relayOnBtn = document.getElementById('relayOnBtn');
        const relayOffBtn = document.getElementById('relayOffBtn');
        
        if (relayOnBtn && relayOffBtn) {
            relayOnBtn.classList.toggle('active', this.relayState === 'on');
            relayOffBtn.classList.toggle('active', this.relayState === 'off');
        }
    }

    showLoading(section) {
        const statusElement = document.getElementById(`${section}Status`);
        if (statusElement) {
            statusElement.innerHTML = '<span class="loading"></span> Mengirim perintah...';
            statusElement.className = 'status-indicator';
        }
    }

    showSuccess(section) {
        const statusElement = document.getElementById(`${section}Status`);
        if (statusElement) {
            statusElement.innerHTML = '✓ Berhasil!';
            statusElement.className = 'status-indicator status-connected';
            
            setTimeout(() => {
                statusElement.innerHTML = '';
            }, 2000);
        }
    }

    showError(section) {
        const statusElement = document.getElementById(`${section}Status`);
        if (statusElement) {
            statusElement.innerHTML = '✗ Error! Periksa koneksi';
            statusElement.className = 'status-indicator status-disconnected';
        }
    }

    async checkConnection() {
        try {
            const response = await fetch('/servo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'angle=90'
            });
            
            this.updateConnectionStatus(response.ok);
        } catch (error) {
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const statusElement = document.getElementById('connectionStatus');
        
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 Terhubung ke Arduino';
                statusElement.className = 'status-indicator status-connected';
            } else {
                statusElement.innerHTML = '🔴 Tidak terhubung';
                statusElement.className = 'status-indicator status-disconnected';
            }
        }
    }
}

class TroubleshootController {
    constructor() {
        this.logElement = null;
        this.statusElements = {
            port: null,
            details: null,
            lastUpdate: null
        };
        this.initElements();
        this.initEventListeners();
        this.updateStatus();
        
        // Update status setiap 5 detik
        setInterval(() => this.updateStatus(), 5000);
    }
    
    initElements() {
        this.logElement = document.getElementById('troubleshootLog');
        this.statusElements.port = document.getElementById('currentPort');
        this.statusElements.details = document.getElementById('connectionDetails');
        this.statusElements.lastUpdate = document.getElementById('lastUpdate');
    }
    
    initEventListeners() {
        document.getElementById('reconnectBtn').addEventListener('click', () => this.reconnect());
        document.getElementById('pingBtn').addEventListener('click', () => this.pingTest());
        document.getElementById('sensorTestBtn').addEventListener('click', () => this.sensorTest());
    }
    
    log(message, type = 'info') {
        if (!this.logElement) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            'info': '[INFO]',
            'error': '[ERROR]',
            'success': '[OK]',
            'warning': '[WARN]'
        }[type] || '[INFO]';
        
        const logMessage = `${timestamp} ${prefix} ${message}\n`;
        this.logElement.textContent += logMessage;
        
        // Auto scroll ke bawah
        this.logElement.scrollTop = this.logElement.scrollHeight;
        
        // Batas maksimum log (hapus baris lama)
        const lines = this.logElement.textContent.split('\n');
        if (lines.length > 50) {
            this.logElement.textContent = lines.slice(-50).join('\n');
        }
    }
    
    async updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (this.statusElements.port) {
                this.statusElements.port.textContent = data.port || 'Unknown';
            }
            
            if (this.statusElements.details) {
                const status = data.connected ? 'Connected' : 'Disconnected';
                this.statusElements.details.textContent = status;
                this.statusElements.details.style.color = data.connected ? '#4CAF50' : '#f44336';
            }
            
            if (this.statusElements.lastUpdate) {
                this.statusElements.lastUpdate.textContent = new Date().toLocaleTimeString();
            }
            
        } catch (error) {
            console.error('Failed to update status:', error);
            if (this.statusElements.details) {
                this.statusElements.details.textContent = 'Error';
                this.statusElements.details.style.color = '#f44336';
            }
        }
    }
    
    async reconnect() {
        const btn = document.getElementById('reconnectBtn');
        btn.disabled = true;
        btn.textContent = '🔄 Reconnecting...';
        
        this.log('Attempting to reconnect to Arduino...', 'info');
        
        try {
            const response = await fetch('/debug/reconnect');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.log(`Reconnection successful: ${data.message} (${data.port})`, 'success');
                await this.updateStatus();
            } else {
                this.log(`Reconnection failed: ${data.message}`, 'error');
            }
            
        } catch (error) {
            this.log(`Reconnection error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '🔄 Reconnect';
        }
    }
    
    async pingTest() {
        const btn = document.getElementById('pingBtn');
        btn.disabled = true;
        btn.textContent = '📡 Pinging...';
        
        this.log('Testing Arduino connection with ping...', 'info');
        
        try {
            const response = await fetch('/debug/ping');
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.log(`Ping successful: ${data.sent} -> ${data.received}`, 'success');
            } else {
                this.log(`Ping failed: ${data.sent} -> ${data.received} (${data.status})`, 'warning');
            }
            
        } catch (error) {
            this.log(`Ping error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '📡 Ping Test';
        }
    }
    
    async sensorTest() {
        const btn = document.getElementById('sensorTestBtn');
        btn.disabled = true;
        btn.textContent = '🧪 Testing...';
        
        this.log('Testing sensor readings...', 'info');
        
        try {
            const response = await fetch('/debug/sensor');
            const data = await response.text();
            
            this.log('Sensor test results:', 'info');
            this.log(data.replace(/<[^>]*>/g, ''), 'info'); // Strip HTML tags
            
        } catch (error) {
            this.log(`Sensor test error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '🧪 Sensor Test';
        }
    }
}

// Initialize the controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.controller = new ServoRelayController();
    window.troubleshoot = new TroubleshootController();
    
    // Add some nice entrance animations
    const sections = document.querySelectorAll('.control-section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.2}s`;
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (window.controller) {
        switch(e.key) {
            case 'ArrowLeft':
                if (window.controller.currentAngle > 0) {
                    const newAngle = Math.max(0, window.controller.currentAngle - 10);
                    document.getElementById('servoRange').value = newAngle;
                    window.controller.currentAngle = newAngle;
                    window.controller.updateAngleDisplay();
                    window.controller.setServoAngle(newAngle);
                }
                break;
            case 'ArrowRight':
                if (window.controller.currentAngle < 180) {
                    const newAngle = Math.min(180, window.controller.currentAngle + 10);
                    document.getElementById('servoRange').value = newAngle;
                    window.controller.currentAngle = newAngle;
                    window.controller.updateAngleDisplay();
                    window.controller.setServoAngle(newAngle);
                }
                break;
            case '1':
                window.controller.setRelay('on');
                break;
            case '0':
                window.controller.setRelay('off');
                break;
            case 'b':
            case 'B':
                // Toggle beep dengan keyboard
                const isEnabled = window.controller.radar.toggleBeep();
                const beepBtn = document.getElementById('beepToggleBtn');
                if (beepBtn) {
                    beepBtn.textContent = isEnabled ? '🔊 BEEP ON' : '🔇 BEEP OFF';
                    beepBtn.className = isEnabled ? 'beep-btn on' : 'beep-btn off';
                }
                break;
        }
    }
});
