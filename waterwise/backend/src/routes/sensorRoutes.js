const router = require('express').Router();
const c = require('../controllers/sensorController');
const auth = require('../middleware/auth');
router.get('/latest', auth, c.latest);
router.get('/history', auth, c.history);
module.exports = router;
