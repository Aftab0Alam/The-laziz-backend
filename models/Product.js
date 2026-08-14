const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: null },
    imageUrl: { type: String, required: true },
    imageAlt: { type: String },
    cloudinaryPublicId: { type: String },
    isVegetarian: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    spicyLevel: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    tags: [{ type: String }],
    servingSize: { type: String },
    prepTimeMinutes: { type: Number },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isVegetarian: 1 });
productSchema.index({ price: 1 });
productSchema.index({ categoryId: 1, displayOrder: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
