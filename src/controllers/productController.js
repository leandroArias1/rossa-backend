const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 15, category, search, active, featured, compatible } = req.query;
    const query = {};
    if (!req.user || req.user.role !== 'admin') query.active = true;
    else if (active !== undefined) query.active = active === 'true';
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (compatible) query.compatible = { $in: [new RegExp(compatible, 'i')] };
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
    const images = req.files ? req.files.map(f => ({ url: f.path, filename: f.filename })) : [];
    const compatibleArr = compatible
      ? compatible.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const product = await Product.create({
      name, description, price, stock, category, brand, partNumber, featured,
      compatible: compatibleArr,
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

    const { name, description, price, stock, category, brand, partNumber, compatible, featured, active, keepImages } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (partNumber !== undefined) product.partNumber = partNumber;
    if (featured !== undefined) product.featured = featured === 'true' || featured === true;
    if (active !== undefined) product.active = active === 'true' || active === true;
    if (compatible !== undefined) {
      product.compatible = compatible
        ? compatible.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    }

    // Manejar imágenes
    let keptImages = [];
    console.log('content-type:', req.headers['content-type']);
    console.log('keepImages recibido:', keepImages);
    console.log('files recibidos:', req.files?.length || 0);
    if (keepImages) {
      try {
        const parsed = JSON.parse(keepImages);
        keptImages = Array.isArray(parsed) ? parsed : [];
      } catch { keptImages = []; }
    } else {
      keptImages = product.images; // conservar todas si no se manda keepImages
    }

    const keptUrls = keptImages.map(i => i.url);
    for (const img of product.images) {
      if (!keptUrls.includes(img.url) && img.filename) {
        try { await cloudinary.uploader.destroy(img.filename); } catch (_) {}
      }
    }

    const newImages = req.files ? req.files.map(f => ({ url: f.path, filename: f.filename })) : [];
    product.images = [...keptImages, ...newImages];

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
