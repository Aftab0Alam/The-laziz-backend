const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  imageUrl: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    deliveryAddress: {
      label: String,
      recipientName: String,
      phone: String,
      street: String,
      landmark: String,
      area: String,
      city: String,
      state: String,
      postalCode: String,
    },
    customerPhone: { type: String, required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    appliedOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    couponCode: { type: String, default: null },
    currentStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'Online'], default: 'Cash on Delivery' },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' },
    specialInstructions: { type: String },
    whatsappSentAt: { type: Date },
    estimatedDeliveryAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ orderCode: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ currentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, currentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
