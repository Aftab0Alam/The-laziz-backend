const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

// Address management
router.get('/addresses', authenticate, authController.getAddresses);
router.post('/addresses', authenticate, authController.addAddress);
router.patch('/addresses/:addrId', authenticate, authController.updateAddress);
router.delete('/addresses/:addrId', authenticate, authController.deleteAddress);

// Favourites
router.get('/favourites', authenticate, authController.getFavourites);
router.post('/favourites/:productId/toggle', authenticate, authController.toggleFavourite);

module.exports = router;
