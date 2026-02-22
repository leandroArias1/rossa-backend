const router = require('express').Router();
const { getOrders, getOrder, createOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect, isAdmin } = require('../middlewares/auth');

router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.post('/', protect, createOrder);
router.patch('/:id/status', protect, isAdmin, updateOrderStatus);

module.exports = router;
