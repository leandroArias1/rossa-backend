const Category = require('../models/Category');

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        const category = await Category.create({ name, slug, description });
        res.status(201).json({ success: true, data: category });
    } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.json({ success: true, data: category });
    } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (err) { next(err); }
};
