const router = require('express').Router();
const { getStats } = require('../controllers/statsController');
const { protect, isAdmin } = require('../middlewares/auth');

router.get('/', protect, isAdmin, getStats);

module.exports = router;
