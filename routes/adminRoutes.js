const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// GET all users (admin only)
router.get('/users', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -failedLoginAttempts -lockUntil').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH user role — admin can promote to admin; superadmin can set any role
router.patch('/users/:id/role', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    // Admins (non-superadmin) can only assign 'user' or 'admin' — not 'superadmin'
    if (req.user.role === 'admin' && role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmins can grant superadmin role' });
    }

    // Prevent demoting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH user active status
router.patch('/users/:id/status', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
