const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: { type: String },
  ipAddress: { type: String },
  rememberMe: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  lastUsedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// TTL index — MongoDB auto-deletes expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
