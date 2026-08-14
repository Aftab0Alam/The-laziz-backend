const mongoose = require('mongoose');

// Each entry in the products array holds a product reference + an optional
// admin-set offer price (overrides the product's own price on the homepage).
const crossSellProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    offerPrice: { type: Number, default: null }, // null = use product's own price
  },
  { _id: false }
);

const crossSellSchema = new mongoose.Schema(
  {
    title:      { type: String, default: "🔥 Today's Offer" },
    subtitle:   { type: String, default: "Limited time deals — grab them before they're gone!" },
    badgeLabel: { type: String, default: 'HOT DEAL' },
    badgeColor: { type: String, default: '#E53935' },
    products:   [crossSellProductSchema],           // NEW — replaces old productIds
    isActive:   { type: Boolean, default: true },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CrossSell', crossSellSchema);
