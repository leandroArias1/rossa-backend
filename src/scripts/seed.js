require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Admin user
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existing) {
        await User.create({
            name: process.env.ADMIN_NAME || 'Administrador',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
        });
        console.log('✅ Admin creado:', process.env.ADMIN_EMAIL);
    } else {
        console.log('ℹ️  Admin ya existe');
    }

    // Categorías base
    const cats = ['Motor', 'Frenos', 'Suspensión', 'Transmisión', 'Eléctrico', 'Carrocería', 'Filtros', 'Embrague'];
    for (const name of cats) {
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        await Category.findOneAndUpdate({ slug }, { name, slug }, { upsert: true });
    }
    console.log('✅ Categorías creadas');

    mongoose.disconnect();
    console.log('✅ Seed completado');
};

seed().catch(console.error);
