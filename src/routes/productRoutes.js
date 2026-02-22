const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProduct } = require('../controllers/productController');
const { protect, isAdmin, optionalAuth } = require('../middlewares/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `product-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Públicas (con auth opcional para que admin pueda ver inactivos)
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProduct);

// Solo admin
router.post('/', protect, isAdmin, upload.array('images', 5), createProduct);
router.put('/:id', protect, isAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.patch('/:id/toggle', protect, isAdmin, toggleProduct);

module.exports = router;
