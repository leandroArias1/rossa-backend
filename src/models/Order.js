const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    image: String,
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        province: String,
        postalCode: String,
        phone: String,
    },
    payment: {
        method: { type: String, default: 'mercadopago' },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
        mpPaymentId: String,
        mpPreferenceId: String,
    },
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
