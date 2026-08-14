const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  customLabel: { type: String },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profileImageUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },
    addresses: [addressSchema],
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'prefer_not_to_say'] },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    settings: {
      receiveEmailOffers: { type: Boolean, default: true },
      receiveWhatsAppUpdates: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
