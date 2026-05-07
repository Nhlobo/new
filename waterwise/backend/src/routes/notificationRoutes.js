const router = require('express').Router();
const c = require('../controllers/notificationController');
const auth = require('../middleware/auth');
router.get('/', auth, c.list);
module.exports = router;
