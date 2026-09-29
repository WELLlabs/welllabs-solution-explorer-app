const mongoose = require('mongoose');

const failedLoginSchema = new mongoose.Schema({
  email: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  reason: { type: String, default: '' },
  route: { type: String, default: 'admin' },
}, { timestamps: true });

// Keep 90 days of history
failedLoginSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('FailedLogin', failedLoginSchema);
