const router = require('express').Router();
const c = require('../controllers/controlController');
const auth = require('../middleware/auth');
router.post('/pump', auth, c.pump);
module.exports = router;
