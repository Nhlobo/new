const IrrigationLog = require('../models/IrrigationLog');

exports.pump = async (req, res) => {
  const { action } = req.body;
  await IrrigationLog.create({ mode: 'manual', action, durationSec: 0, waterUsedLiters: 0 });
  res.json({ ok: true, action });
};
