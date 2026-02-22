const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 15, category, search, active, featured } = req.query;
        const query = {};
        if (!req.user || req.user.role !== 'admin') query.active = true;
        else if (active !== undefined) query.active = active === 'true';
        if (category) query.category = category;
        if (featured) query.featured = featured === 'true';
        if (req.query.compatible) query.compatible = { $in: [new RegExp(req.query.compatible, "i")] };
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { partNumber: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
        ];
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ success: true, data: products, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name slug');
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, data: product });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, brand, partNumber, compatible, featured } = req.body;
        const images = req.files ? req.files.map(file => ({
            url: file.path,
            filename: file.filename,
        })) : [];
        const product = await Product.create({
            name, description, price, stock, category, brand, partNumber, featured,
            compatible: compatible ? compatible.split(',').map(s => s.trim()).filter(Boolean) : [],
            images,
        });
        await product.populate('category', 'name slug');
        res.status(201).json({ success: true, data: product });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        const { name, description, price, stock, category, brand, partNumber, compatible, featured, active } = req.body;
        if (name) product.name = name;
        if (description !== undefined) product.description = description;
        if (price) product.price = price;
        if (stock !== undefined) product.stock = stock;
        if (category) product.category = category;
        if (brand !== undefined) product.brand = brand;
        if (partNumber !== undefined) product.partNumber = partNumber;
        if (featured !== undefined) product.featured = featured === 'true' || featured === true;
        if (active !== undefined) product.active = active === 'true' || active === true;
        if (compatible !== undefined) product.compatible = compatible ? compatible.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (req.files && req.files.length > 0) {
            // Eliminar imágenes viejas de Cloudinary
            for (const img of product.images) {
                if (img.filename) {
                    try { await cloudinary.uploader.destroy(img.filename); } catch (_) {}
                }
            }
            product.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
        }
        await product.save();
        await product.populate('category', 'name slug');
        res.json({ success: true, data: product });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        for (const img of product.images) {
            if (img.filename) {
                try { await cloudinary.uploader.destroy(img.filename); } catch (_) {}
            }
        }
        await product.deleteOne();
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        product.active = !product.active;
        await product.save();
        res.json({ success: true, data: product });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
