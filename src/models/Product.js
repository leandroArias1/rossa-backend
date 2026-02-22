const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String, trim: true },
    partNumber: { type: String, trim: true },
    compatible: [{ type: String }], // Modelos IVECO compatibles
    images: [{
        url: String,
        filename: String,
    }],
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
}, { timestamps: true });

productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-') + '-' + Date.now();
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
