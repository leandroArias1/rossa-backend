const User = require('../models/User');

// @GET /api/users  —  solo admin
exports.getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        const query = {};
        if (role)   query.role = role;
        if (search) query.$or = [
            { name:  new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
        ];

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort('-createdAt')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({ success: true, total, users });
    } catch (error) {
        next(error);
    }
};

// @PATCH /api/users/:id/toggle  —  activar/desactivar usuario
exports.toggleUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // No puede desactivarse a sí mismo
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'No podés desactivar tu propia cuenta' });
        }

        user.active = !user.active;
        await user.save();
        res.json({ success: true, active: user.active });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/users/:id/role  —  cambiar rol
exports.changeRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['admin', 'client'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rol inválido' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
