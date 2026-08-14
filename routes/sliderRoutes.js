const express = require('express');
const router = express.Router();
const Slider = require('../models/Slider');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { uploadSliderImage } = require('../middlewares/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// Public — get active sliders
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const sliders = await Slider.find({
      isActive: true,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
      ],
    }).sort({ displayOrder: 1 });
    return res.status(200).json({ success: true, data: { sliders } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin — get all sliders
router.get('/admin/all', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ displayOrder: 1 });
    return res.status(200).json({ success: true, data: { sliders } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', authenticate, requireRole('admin', 'superadmin'), uploadSliderImage.single('image'), async (req, res) => {
  try {
    const { title, subtitle, ctaButtonText, linkType, linkedCategoryId, linkedProductId, displayOrder, isActive, validFrom, validUntil, imageUrl: bodyImageUrl } = req.body;
    // Accept either a new uploaded file OR an existing image URL
    if (!req.file && !bodyImageUrl) return res.status(400).json({ success: false, message: 'Slider image required' });
    const slider = await Slider.create({
      title, subtitle, ctaButtonText, linkType: linkType || 'none',
      linkedCategoryId: linkedCategoryId || null, linkedProductId: linkedProductId || null,
      imageUrl: req.file ? req.file.path : bodyImageUrl,
      cloudinaryPublicId: req.file ? req.file.filename : null,
      displayOrder: Number(displayOrder) || 0, isActive: isActive !== 'false',
      validFrom: validFrom || null, validUntil: validUntil || null,
    });
    return res.status(201).json({ success: true, data: { slider } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'superadmin'), uploadSliderImage.single('image'), async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    const updates = { ...req.body };
    if (req.file) {
      if (slider.cloudinaryPublicId) await cloudinary.uploader.destroy(slider.cloudinaryPublicId);
      updates.imageUrl = req.file.path; updates.cloudinaryPublicId = req.file.filename;
    }
    const updated = await Slider.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.status(200).json({ success: true, data: { slider: updated } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Not found' });
    if (slider.cloudinaryPublicId) await cloudinary.uploader.destroy(slider.cloudinaryPublicId);
    await slider.deleteOne();
    return res.status(200).json({ success: true, message: 'Slider deleted' });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
