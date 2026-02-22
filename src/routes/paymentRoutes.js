const router = require('express').Router();
const { protect } = require('../middlewares/auth');

// Placeholder para Mercado Pago - implementar cuando tengas las credenciales reales
router.post('/create-preference', protect, (req, res) => {
    res.json({ success: false, message: 'Integración Mercado Pago pendiente de configurar' });
});

router.post('/webhook', (req, res) => {
    // MP llama este endpoint - registrar el pago
    console.log('Webhook MP recibido:', req.body);
    res.sendStatus(200);
});

module.exports = router;
