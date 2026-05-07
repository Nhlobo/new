exports.get = async (_, res) => res.json({ moistureThreshold: 35, autoMode: true, waterSavingMode: true });
exports.update = async (req, res) => res.json({ ok: true, ...req.body });
