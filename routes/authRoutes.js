const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { uploadProfileImage } = require('../middlewares/uploadMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

// Profile management
router.patch('/profile', authenticate, authController.updateProfile);
router.patch('/avatar', authenticate, uploadProfileImage.single('avatar'), authController.uploadAvatar);
router.patch('/change-password', authenticate, authController.changePassword);
router.get('/stats', authenticate, authController.getUserStats);

// Address management
router.get('/addresses', authenticate, authController.getAddresses);
router.post('/addresses', authenticate, authController.addAddress);
router.patch('/addresses/:addrId', authenticate, authController.updateAddress);
router.delete('/addresses/:addrId', authenticate, authController.deleteAddress);

// Favourites
router.get('/favourites', authenticate, authController.getFavourites);
router.post('/favourites/:productId/toggle', authenticate, authController.toggleFavourite);

module.exports = router;
