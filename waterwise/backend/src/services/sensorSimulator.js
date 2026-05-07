const SensorData = require('../models/SensorData');

let state = { moisture: 57, tankLevel: 78, flowRate: 0, temperature: 27, battery: 88, solarCharging: true, pumpOn: false, valveOpen: false, wifiSignal: 82, systemHealth: 'Healthy', rainDetected: false, leakDetected: false };

function tick() {
  const jitter = (n=2)=> (Math.random()*n*2)-n;
  state.moisture = Math.max(10, Math.min(90, state.moisture + jitter(1.5)));
  state.tankLevel = Math.max(5, Math.min(100, state.tankLevel + (state.pumpOn ? -0.4 : 0.05)));
  state.flowRate = state.pumpOn ? Math.max(5, 18 + jitter(2)) : 0;
  state.temperature = Math.max(17, Math.min(43, state.temperature + jitter(0.6)));
  state.battery = Math.max(15, Math.min(100, state.battery + (state.solarCharging ? 0.05 : -0.04)));
  state.rainDetected = Math.random() < 0.03;
  state.leakDetected = Math.random() < 0.02;
  state.systemHealth = state.leakDetected ? 'Warning' : 'Healthy';
  return { ...state, timestamp: new Date().toISOString() };
}

exports.start = (onUpdate) => {
  setInterval(async () => {
    const snapshot = tick();
    onUpdate(snapshot);
    await SensorData.create(snapshot);
  }, 2500);
};
