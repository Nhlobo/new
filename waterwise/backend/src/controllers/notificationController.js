const Notification = require('../models/Notification');
exports.list = async (_, res) => res.json(await Notification.find().sort({ createdAt: -1 }).limit(100));
