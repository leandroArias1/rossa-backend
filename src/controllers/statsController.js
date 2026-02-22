const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getStats = async (req, res, next) => {
    try {
        const [totalOrders, totalProducts, totalUsers, pendingOrders] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments({ active: true }),
            User.countDocuments({ role: 'client' }),
            Order.countDocuments({ status: 'pending' }),
        ]);

        const revenueResult = await Order.aggregate([
            { $match: { 'payment.status': 'approved' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: { totalOrders, totalProducts, totalUsers, pendingOrders, totalRevenue, recentOrders },
        });
    } catch (err) { next(err); }
};
