const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, category, search, featured, active } = req.query;
        const query = {};

        // Clientes solo ven productos activos
        if (!req.user || req.user.role !== 'admin') query.active = true;
        if (active !== undefined && req.user?.role === 'admin') query.active = active === 'true';
        if (category) query.category = category;
        if (featured) query.featured = true;
        if (search) query.$text = { $search: search };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: products,
            pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
        });
    } catch (err) { next(err); }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name slug');
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, data: product });
    } catch (err) { next(err); }
};

// POST /api/products  (admin)
exports.createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock, category, brand, partNumber, compatible, featured } = req.body;

        const images = req.files?.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
        })) || [];

        const product = await Product.create({
            name, description, price, stock, category, brand, partNumber,
            compatible: compatible ? JSON.parse(compatible) : [],
            featured: featured === 'true',
            images,
        });

        res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
};

// PUT /api/products/:id  (admin)
exports.updateProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock, category, brand, partNumber, compatible, featured, active } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // Nuevas imágenes si se subieron
        if (req.files?.length > 0) {
            const newImages = req.files.map(file => ({ url: `/uploads/${file.filename}`, filename: file.filename }));
            product.images = [...product.images, ...newImages];
        }

        Object.assign(product, {
            name: name || product.name,
            description: description ?? product.description,
            price: price ?? product.price,
            stock: stock ?? product.stock,
            category: category || product.category,
            brand: brand ?? product.brand,
            partNumber: partNumber ?? product.partNumber,
            compatible: compatible ? JSON.parse(compatible) : product.compatible,
            featured: featured !== undefined ? featured === 'true' : product.featured,
            active: active !== undefined ? active === 'true' : product.active,
        });

        await product.save();
        res.json({ success: true, data: product });
    } catch (err) { next(err); }
};

// DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // Eliminar imágenes locales
        product.images.forEach(img => {
            const filePath = path.join(__dirname, '../../uploads', img.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        await product.deleteOne();
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) { next(err); }
};

// PATCH /api/products/:id/toggle  (admin)
exports.toggleProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        product.active = !product.active;
        await product.save();
        res.json({ success: true, data: product, message: `Producto ${product.active ? 'activado' : 'desactivado'}` });
    } catch (err) { next(err); }
};
