const SensorData = require('../models/SensorData');

exports.latest = async (_, res) => {
  const last = await SensorData.findOne().sort({ createdAt: -1 });
  res.json(last);
};

exports.history = async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const data = await SensorData.find().sort({ createdAt: -1 }).limit(limit);
  res.json(data.reverse());
};
