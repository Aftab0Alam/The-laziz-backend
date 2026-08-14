const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');

// GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const { category, isVeg, minPrice, maxPrice, isBestSeller, isFeatured, isNewArrival, sort, page = 1, limit = 12, available = true } = req.query;
    const filter = {};
    if (available !== 'all') filter.isAvailable = true;
    if (category) { const cat = await Category.findOne({ slug: category }); if (cat) filter.categoryId = cat._id; }
    if (isVeg === 'true') filter.isVegetarian = true;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (isBestSeller === 'true') filter.isBestSeller = true;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (isNewArrival === 'true') filter.isNewArrival = true;

    let sortObj = { displayOrder: 1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { averageRating: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate('categoryId', 'name slug').sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data: { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SEARCH PRODUCTS
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    if (!q || q.trim().length < 1) return res.status(200).json({ success: true, data: { products: [] } });

    const products = await Product.find(
      { $text: { $search: q }, isAvailable: true },
      { score: { $meta: 'textScore' } }
    ).populate('categoryId', 'name slug').sort({ score: { $meta: 'textScore' } }).limit(Number(limit));

    return res.status(200).json({ success: true, data: { products } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('categoryId', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET RELATED PRODUCTS
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await Product.find({ categoryId: product.categoryId, _id: { $ne: product._id }, isAvailable: true }).limit(6);
    return res.status(200).json({ success: true, data: { products: related } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, categoryId, description, price, discountedPrice, isVegetarian, spicyLevel, tags, servingSize, prepTimeMinutes, isAvailable, isBestSeller, isFeatured, isNewArrival, displayOrder } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Product image is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await Product.create({
      name, slug, categoryId, description, price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      imageUrl: req.file.path, cloudinaryPublicId: req.file.filename,
      isVegetarian: isVegetarian === 'true', spicyLevel: Number(spicyLevel) || 0,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      servingSize, prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : null,
      isAvailable: isAvailable !== 'false', isBestSeller: isBestSeller === 'true',
      isFeatured: isFeatured === 'true', isNewArrival: isNewArrival === 'true',
      displayOrder: Number(displayOrder) || 0,
    });
    return res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const updates = { ...req.body };
    if (req.file) {
      if (product.cloudinaryPublicId) await cloudinary.uploader.destroy(product.cloudinaryPublicId);
      updates.imageUrl = req.file.path;
      updates.cloudinaryPublicId = req.file.filename;
    }
    if (updates.price) updates.price = Number(updates.price);
    if (updates.discountedPrice) updates.discountedPrice = Number(updates.discountedPrice);
    if (updates.isVegetarian !== undefined) updates.isVegetarian = updates.isVegetarian === 'true';
    if (updates.isBestSeller !== undefined) updates.isBestSeller = updates.isBestSeller === 'true';
    if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === 'true';
    if (updates.isAvailable !== undefined) updates.isAvailable = updates.isAvailable !== 'false';

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.status(200).json({ success: true, data: { product: updated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.cloudinaryPublicId) await cloudinary.uploader.destroy(product.cloudinaryPublicId);
    await product.deleteOne();
    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
