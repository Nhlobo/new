const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: String,
  message: String,
  severity: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
