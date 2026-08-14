const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: 'LAZIZ RESTAURANT' },
    tagline: { type: String, default: 'Authentic Flavours, Delivered to Your Door' },
    logoUrl: { type: String },
    address: { type: String },
    mapEmbedUrl: { type: String },
    whatsappNumber: { type: String, required: true },
    adminNotificationNumbers: [{ type: String }],
    phoneNumbers: [{ type: String }],
    emailAddress: { type: String },
    isOpen: { type: Boolean, default: true },
    operatingHours: [
      {
        day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '11:00' },
        closeTime: { type: String, default: '23:00' },
      },
    ],
    closedMessage: { type: String, default: "We're closed right now. Please check back during our hours!" },
    minimumOrderAmount: { type: Number, default: 150 },
    deliveryFee: { type: Number, default: 40 },
    freeDeliveryAbove: { type: Number, default: 499 },
    estimatedDeliveryMinutes: { type: String, default: '30-45' },
    taxLabel: { type: String, default: 'GST' },
    taxPercentage: { type: Number, default: 5 },
    socialLinks: {
      facebook: { type: String },
      instagram: { type: String },
      youtube: { type: String },
    },
    seoTitle: { type: String },
    seoDescription: { type: String },
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
