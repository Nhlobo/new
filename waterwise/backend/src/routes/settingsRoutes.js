const router = require('express').Router();
const c = require('../controllers/settingsController');
const auth = require('../middleware/auth');
router.get('/', auth, c.get);
router.put('/', auth, c.update);
module.exports = router;
