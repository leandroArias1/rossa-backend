const router = require('express').Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProduct } = require('../controllers/productController');
const { protect, isAdmin, optionalAuth } = require('../middlewares/auth');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rossa-repuestos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProduct);
router.post('/', protect, isAdmin, upload.array('images', 5), createProduct);
router.put('/:id', protect, isAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.patch('/:id/toggle', protect, isAdmin, toggleProduct);

module.exports = router;
