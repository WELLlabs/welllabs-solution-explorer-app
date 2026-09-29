const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminEmail: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['user', 'layer'], required: true, index: true },
  targetId: { type: String, default: '' },
  targetLabel: { type: String, default: '' },
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
