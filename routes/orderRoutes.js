const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// User routes
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/my-orders/:id', authenticate, orderController.getOrder);
router.patch('/my-orders/:id/cancel', authenticate, orderController.cancelOrder);

// Admin routes
router.get('/admin/all', authenticate, requireRole('admin', 'superadmin'), orderController.getAllOrders);
router.patch('/admin/:id/status', authenticate, requireRole('admin', 'superadmin'), orderController.updateOrderStatus);
router.get('/admin/dashboard-stats', authenticate, requireRole('admin', 'superadmin'), orderController.getDashboardStats);

module.exports = router;
