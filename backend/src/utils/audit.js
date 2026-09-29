const AuditLog = require('../models/AuditLog');

/**
 * Record an admin action. Never throws: a failed audit write is logged
 * but must not break the action the admin performed.
 */
const logAudit = async (req, { action, targetType, targetId = '', targetLabel = '', changes = {} }) => {
  try {
    await AuditLog.create({
      admin: req.user?._id,
      adminEmail: req.user?.email || '',
      action,
      targetType,
      targetId: String(targetId),
      targetLabel,
      changes,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

/** Field-by-field diff of two plain objects, limited to the given keys. */
const diffFields = (before, after, keys) => {
  const changes = {};
  for (const key of keys) {
    const from = before?.[key] ?? '';
    const to = after?.[key] ?? '';
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
};

module.exports = { logAudit, diffFields };
