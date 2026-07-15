const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { uploadCategoryImage } = require('../middlewares/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    return res.status(200).json({ success: true, data: { categories } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin
router.post('/', authenticate, requireRole('admin', 'superadmin'), uploadCategoryImage.single('image'), async (req, res) => {
  try {
    const { name, description, displayOrder, isActive, isFeatured } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create({
      name, slug, description,
      imageUrl: req.file?.path || null,
      cloudinaryPublicId: req.file?.filename || null,
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== 'false',
      isFeatured: isFeatured === 'true',
    });
    return res.status(201).json({ success: true, data: { category } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'superadmin'), uploadCategoryImage.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    const updates = { ...req.body };
    if (req.file) {
      if (category.cloudinaryPublicId) await cloudinary.uploader.destroy(category.cloudinaryPublicId);
      updates.imageUrl = req.file.path;
      updates.cloudinaryPublicId = req.file.filename;
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.status(200).json({ success: true, data: { category: updated } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    if (category.cloudinaryPublicId) await cloudinary.uploader.destroy(category.cloudinaryPublicId);
    await category.deleteOne();
    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
