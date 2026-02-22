const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const Order = require('../models/Order');
const Product = require('../models/Product');

const getClient = () =>
    new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// @POST /api/payments/create-preference  —  crear preferencia de pago
exports.createPreference = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId).populate('items.product', 'name');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        // Solo el dueño puede pagar
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const preference = new Preference(getClient());
        const externalReference = `ROSSA-${order._id}`;

        const preferenceData = {
            items: order.items.map((item) => ({
                id:          item.product._id.toString(),
                title:       item.name,
                quantity:    item.quantity,
                unit_price:  item.price,
                currency_id: 'ARS',
            })),
            payer: {
                email: req.user.email,
                name:  req.user.name,
            },
            external_reference: externalReference,
            back_urls: {
                success: `${process.env.FRONTEND_URL}/pedido/exitoso`,
                failure: `${process.env.FRONTEND_URL}/pedido/fallido`,
                pending: `${process.env.FRONTEND_URL}/pedido/pendiente`,
            },
            auto_return:      'approved',
            notification_url: `${process.env.BACKEND_URL || 'https://tu-backend.com'}/api/payments/webhook`,
            statement_descriptor: 'ROSSA REPUESTOS',
        };

        const result = await preference.create({ body: preferenceData });

        // Guardar preferenceId en el pedido
        await Order.findByIdAndUpdate(orderId, {
            'payment.mpPreferenceId':  result.id,
            'payment.mpExternalRef':   externalReference,
        });

        res.json({
            success:       true,
            preferenceId:  result.id,
            initPoint:     result.init_point,      // Producción
            sandboxInitPoint: result.sandbox_init_point, // Test
        });
    } catch (error) {
        next(error);
    }
};

// @POST /api/payments/webhook  —  webhook de Mercado Pago
exports.webhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type !== 'payment') {
            return res.status(200).json({ received: true });
        }

        const payment = new Payment(getClient());
        const paymentData = await payment.get({ id: data.id });

        const externalRef = paymentData.external_reference;
        const orderId = externalRef?.replace('ROSSA-', '');

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        // Actualizar estado de pago
        const paymentStatus = paymentData.status;
        order.payment.mpPaymentId = String(data.id);
        order.payment.status = paymentStatus;

        if (paymentStatus === 'approved') {
            order.status = 'paid';
            order.payment.paidAt = new Date();
            order.statusHistory.push({ status: 'paid', comment: 'Pago aprobado por Mercado Pago' });

            // Descontar stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity },
                });
            }
        } else if (paymentStatus === 'rejected') {
            order.payment.status = 'rejected';
            order.statusHistory.push({ status: 'pending', comment: 'Pago rechazado' });
        } else if (paymentStatus === 'in_process') {
            order.payment.status = 'in_process';
        }

        await order.save();
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook error' });
    }
};

// @GET /api/payments/status/:orderId  —  consultar estado
exports.getPaymentStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId).select('payment status');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }
        res.json({ success: true, payment: order.payment, status: order.status });
    } catch (error) {
        next(error);
    }
};
