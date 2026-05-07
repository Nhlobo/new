const IrrigationLog = require('../models/IrrigationLog');
exports.logs = async (_, res) => res.json(await IrrigationLog.find().sort({ createdAt: -1 }).limit(200));
