const Order = require('../models/Order');
const Product = require('../models/Product');

// GET /api/orders  (admin: todos, client: los propios)
exports.getOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = req.user.role === 'admin' ? {} : { user: req.user._id };
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name images');
        if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        // Clientes solo pueden ver sus propias órdenes
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }
        res.json({ success: true, data: order });
    } catch (err) { next(err); }
};

// POST /api/orders  (clientes)
exports.createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, notes } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Sin productos en la orden' });

        // Verificar stock y calcular total
        let total = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product || !product.active) return res.status(400).json({ success: false, message: `Producto no disponible: ${item.product}` });
            if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Stock insuficiente: ${product.name}` });

            total += product.price * item.quantity;
            orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.images[0]?.url || '' });
        }

        const order = await Order.create({ user: req.user._id, items: orderItems, total, shippingAddress, notes });
        res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
};

// PATCH /api/orders/:id/status  (admin)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        res.json({ success: true, data: order });
    } catch (err) { next(err); }
};
