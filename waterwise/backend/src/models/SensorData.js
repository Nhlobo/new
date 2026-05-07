const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  moisture: Number,
  tankLevel: Number,
  flowRate: Number,
  temperature: Number,
  battery: Number,
  solarCharging: Boolean,
  pumpOn: Boolean,
  valveOpen: Boolean,
  wifiSignal: Number,
  systemHealth: String,
  rainDetected: Boolean,
  leakDetected: Boolean
}, { timestamps: true });

module.exports = mongoose.model('SensorData', SensorDataSchema);
