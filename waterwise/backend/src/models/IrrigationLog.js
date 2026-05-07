const mongoose = require('mongoose');

const IrrigationLogSchema = new mongoose.Schema({
  mode: String,
  action: String,
  durationSec: Number,
  waterUsedLiters: Number
}, { timestamps: true });

module.exports = mongoose.model('IrrigationLog', IrrigationLogSchema);
