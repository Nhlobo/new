const router = require('express').Router();
const c = require('../controllers/historyController');
const auth = require('../middleware/auth');
router.get('/irrigation', auth, c.logs);
module.exports = router;
