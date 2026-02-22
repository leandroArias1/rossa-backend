const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { name, email, password, phone } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email ya registrado' });

        const user = await User.create({ name, email, password, phone });
        const token = generateToken(user._id);

        res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });

        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.active) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

        const token = generateToken(user._id);
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};
