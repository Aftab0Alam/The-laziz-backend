const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { uploadProductImage } = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/:slug', productController.getProduct);
router.get('/:id/related', productController.getRelatedProducts);

// Admin routes
router.post('/', authenticate, requireRole('admin', 'superadmin'), uploadProductImage.single('image'), productController.createProduct);
router.put('/:id', authenticate, requireRole('admin', 'superadmin'), uploadProductImage.single('image'), productController.updateProduct);
router.patch('/:id', authenticate, requireRole('admin', 'superadmin'), productController.updateProduct);
router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), productController.deleteProduct);

module.exports = router;
