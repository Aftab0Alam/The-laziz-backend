const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// Public — get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        restaurantName: 'LAZIZ RESTAURANT',
        whatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER || '919876543210',
        operatingHours: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => ({ day, isOpen: true, openTime: '11:00', closeTime: '23:00' })),
      });
    }
    return res.status(200).json({ success: true, data: { settings } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin — update settings
router.patch('/', authenticate, requireRole('superadmin'), async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    return res.status(200).json({ success: true, data: { settings } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
