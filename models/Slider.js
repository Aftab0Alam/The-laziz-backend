const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String },
    cloudinaryPublicId: { type: String },
    linkType: { type: String, enum: ['product', 'category', 'offer', 'external', 'none'], default: 'none' },
    linkedProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    linkedCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    linkedOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    externalUrl: { type: String },
    ctaButtonText: { type: String, default: 'Order Now' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

sliderSchema.index({ displayOrder: 1 });
sliderSchema.index({ isActive: 1 });

module.exports = mongoose.model('Slider', sliderSchema);
