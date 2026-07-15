const express = require('express');
const router  = express.Router();
const CrossSell = require('../models/CrossSell');
const Product   = require('../models/Product');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// ─── Helper: populate products and merge offerPrice into each product object ──
async function populateAndMerge(doc) {
  if (!doc) return null;

  const productIds = (doc.products || []).map(p => p.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds }, isAvailable: true })
    .select('name slug imageUrl price discountedPrice isBestSeller isFeatured isAvailable averageRating totalReviews');

  const productMap = {};
  dbProducts.forEach(p => { productMap[p._id.toString()] = p.toObject(); });

  // Build merged list preserving admin's order, injecting offerPrice
  const merged = (doc.products || [])
    .map(entry => {
      const base = productMap[entry.productId?.toString()];
      if (!base) return null; // product unavailable / deleted
      return {
        ...base,
        // If admin set an offer price, expose it as `offerPrice`; UI uses it instead of price
        offerPrice: entry.offerPrice != null ? entry.offerPrice : null,
      };
    })
    .filter(Boolean);

  return {
    _id:        doc._id,
    title:      doc.title,
    subtitle:   doc.subtitle,
    badgeLabel: doc.badgeLabel,
    badgeColor: doc.badgeColor,
    isActive:   doc.isActive,
    updatedAt:  doc.updatedAt,
    products:   merged,   // renamed field — frontend reads from doc.products
    // Keep productIds as well for backward-compat with old admin picker code
    productIds: merged,
  };
}

// ─── PUBLIC: get active cross-sell section ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let doc = await CrossSell.findOne();

    // Auto-create a default doc if none exists
    if (!doc) {
      const fallback = await Product.find({ isBestSeller: true, isAvailable: true }).limit(6);
      doc = await CrossSell.create({
        products: fallback.map(p => ({ productId: p._id, offerPrice: null })),
      });
      doc = await CrossSell.findById(doc._id);
    }

    const crossSell = await populateAndMerge(doc);
    return res.status(200).json({ success: true, data: { crossSell } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: get all products list (for the picker) ─────────────────────────
router.get('/products', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true })
      .select('name slug imageUrl price discountedPrice categoryId isBestSeller isFeatured')
      .sort({ displayOrder: 1 })
      .limit(100);
    return res.status(200).json({ success: true, data: { products } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: get current cross-sell doc (for admin panel load) ──────────────
router.get('/admin', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const doc = await CrossSell.findOne();
    if (!doc) return res.status(200).json({ success: true, data: { crossSell: null } });
    const crossSell = await populateAndMerge(doc);
    return res.status(200).json({ success: true, data: { crossSell } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: update (upsert) cross-sell section ─────────────────────────────
// Body shape: { title, subtitle, badgeLabel, badgeColor, isActive,
//               products: [{ productId, offerPrice }] }
router.put('/', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { title, subtitle, badgeLabel, badgeColor, products, isActive } = req.body;

    // Normalise the products array — accept both new format { productId, offerPrice }
    // and old format (plain string/ObjectId) for backward compatibility
    let normalised;
    if (Array.isArray(products)) {
      normalised = products.map(p => {
        if (typeof p === 'string' || p instanceof require('mongoose').Types.ObjectId) {
          return { productId: p, offerPrice: null };
        }
        return {
          productId:  p.productId || p._id,
          offerPrice: p.offerPrice != null ? Number(p.offerPrice) : null,
        };
      });
    }

    const doc = await CrossSell.findOneAndUpdate(
      {},
      {
        ...(title      !== undefined && { title }),
        ...(subtitle   !== undefined && { subtitle }),
        ...(badgeLabel !== undefined && { badgeLabel }),
        ...(badgeColor !== undefined && { badgeColor }),
        ...(normalised !== undefined && { products: normalised }),
        ...(isActive   !== undefined && { isActive }),
        updatedBy: req.user._id,
      },
      { new: true, upsert: true }
    );

    const crossSell = await populateAndMerge(doc);
    return res.status(200).json({ success: true, data: { crossSell } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
