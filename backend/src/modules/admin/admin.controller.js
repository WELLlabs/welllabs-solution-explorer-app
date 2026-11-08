const crypto = require('crypto');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const FailedLogin = require('../../models/FailedLogin');
const FloodHotspot = require('../../models/FloodHotspot');
const { logAudit } = require('../../utils/audit');
const { roleForRegistration, hashToken, frontendOrigin } = require('../auth/auth.controller');
const { sendEmail } = require('../../utils/mailer');
const { LAYERS, normalizeRecord, describeLayers } = require('./layers');

const RESET_LINK_HOURS = 24;
const INVITE_LINK_DAYS = 7;
const MAX_IMPORT_ROWS = 5000;
const PERSONAS = ['govt', 'funder', 'designer', 'citizen'];

const issuePasswordToken = (user, purpose, ttlMs) => {
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordTokenHash = hashToken(token);
  user.passwordTokenPurpose = purpose;
  user.passwordTokenExpires = new Date(Date.now() + ttlMs);
  return token;
};

// Emails an invite or reset link to the user. The admin still sees the link, so a failed email is not fatal.
const emailPasswordLink = async (req, user, token, purpose) => {
  const link = `${frontendOrigin(req.headers.origin)}/set-password?token=${token}`;
  const invite = purpose === 'invite';
  const sent = await sendEmail({
    to: user.email,
    subject: invite ? 'You are invited to Climate Solutions' : 'Reset your Climate Solutions password',
    content: {
      heading: invite ? `Welcome, ${user.name}` : 'Reset your password',
      intro: invite
        ? 'An administrator has created a Climate Solutions account for you. Open the link below to choose your password and sign in.'
        : 'An administrator has sent you a link to choose a new password for your Climate Solutions account.',
      rows: [['Account', user.email]],
      button: { label: invite ? 'Set your password' : 'Choose a new password', url: link },
      footer: `The link expires on ${user.passwordTokenExpires.toUTCString()} and works once.`,
    },
  });
  return { emailed: sent.ok, emailError: sent.ok ? undefined : sent.message };
};

const findTargetUser = async (req, res) => {
  const user = await User.findById(req.params.id).catch(() => null);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return user;
};

const publicUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.passwordTokenHash;
  delete obj.passwordTokenPurpose;
  delete obj.passwordTokenExpires;
  return obj;
};

// ─── Users ──────────────────────────────────────────────────────────────────

// POST /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
  try {
    const user = await findTargetUser(req, res);
    if (!user) return;
    if (user._id.equals(req.user._id) || user.role === 'Admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be suspended' });
    }
    const reason = String(req.body?.reason || '').trim().slice(0, 300);
    user.status = 'suspended';
    user.suspendedAt = new Date();
    user.suspendedReason = reason;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await logAudit(req, {
      action: 'user.suspend',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
      changes: { status: { from: 'active', to: 'suspended' }, reason },
    });
    res.json(publicUser(user));
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error suspending user' });
  }
};

// POST /api/admin/users/:id/activate
const activateUser = async (req, res) => {
  try {
    const user = await findTargetUser(req, res);
    if (!user) return;
    const hasPassword = !!(await User.exists({ _id: user._id, password: { $nin: [null, ''] } }));
    const from = user.status;
    user.status = hasPassword || user.authProvider === 'google' ? 'active' : 'invited';
    user.suspendedAt = null;
    user.suspendedReason = '';
    await user.save();
    await logAudit(req, {
      action: 'user.activate',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
      changes: { status: { from, to: user.status } },
    });
    res.json(publicUser(user));
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error reactivating user' });
  }
};

// POST /api/admin/users/:id/reset-link
const createResetLink = async (req, res) => {
  try {
    const user = await findTargetUser(req, res);
    if (!user) return;
    const purpose = user.status === 'invited' ? 'invite' : 'reset';
    const ttl = purpose === 'invite' ? INVITE_LINK_DAYS * 24 * 3600 * 1000 : RESET_LINK_HOURS * 3600 * 1000;
    const token = issuePasswordToken(user, purpose, ttl);
    await user.save();
    await logAudit(req, {
      action: purpose === 'invite' ? 'user.invite_link' : 'user.reset_link',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
    });
    const delivery = await emailPasswordLink(req, user, token, purpose);
    res.json({ token, purpose, expiresAt: user.passwordTokenExpires, ...delivery });
  } catch (error) {
    console.error('Reset link error:', error);
    res.status(500).json({ message: 'Server error creating reset link' });
  }
};

// POST /api/admin/users/:id/force-logout
const forceLogout = async (req, res) => {
  try {
    const user = await findTargetUser(req, res);
    if (!user) return;
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Use Sign Out to end your own session' });
    }
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await logAudit(req, {
      action: 'user.force_logout',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
    });
    res.json({ message: `${user.email} has been signed out of all sessions` });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ message: 'Server error signing user out' });
  }
};

// POST /api/admin/users/invite
const inviteUser = async (req, res) => {
  try {
    const { name, email, persona, userType = '', organization = '', phone = '' } = req.body || {};
    const cleanEmail = String(email || '').toLowerCase().trim();

    if (!String(name || '').trim()) return res.status(400).json({ message: 'Name is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (!PERSONAS.includes(persona)) return res.status(400).json({ message: 'Please choose a role' });
    if (await User.exists({ email: cleanEmail })) return res.status(400).json({ message: 'An account with this email already exists' });

    const role = roleForRegistration({ email: cleanEmail, persona, userType });
    if (role === 'Admin') return res.status(400).json({ message: 'The admin account cannot be invited' });

    const user = new User({
      userId: `USR-${persona.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
      name: String(name).trim(),
      email: cleanEmail,
      persona,
      userType,
      organization: String(organization).trim(),
      phone: String(phone).trim(),
      role,
      status: 'invited',
      authProvider: 'local',
      invitedBy: req.user._id,
    });
    const token = issuePasswordToken(user, 'invite', INVITE_LINK_DAYS * 24 * 3600 * 1000);
    await user.save();

    await logAudit(req, {
      action: 'user.invite',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
      changes: { name: user.name, persona, userType, role },
    });
    const delivery = await emailPasswordLink(req, user, token, 'invite');
    res.status(201).json({ user: publicUser(user), token, expiresAt: user.passwordTokenExpires, ...delivery });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error inviting user' });
  }
};

// ─── Audit trail & security ────────────────────────────────────────────────

// GET /api/admin/audit?targetType=&action=&q=&limit=
const getAuditLogs = async (req, res) => {
  try {
    const { targetType, action, q } = req.query;
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (action) filter.action = action;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ targetLabel: rx }, { adminEmail: rx }, { targetId: rx }];
    }
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching audit trail' });
  }
};

// GET /api/admin/failed-logins?days=&limit=
const getFailedLogins = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const [attempts, byIp] = await Promise.all([
      FailedLogin.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      FailedLogin.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$ip', count: { $sum: 1 }, last: { $max: '$createdAt' }, emails: { $addToSet: '$email' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);
    res.json({ attempts, byIp });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching failed logins' });
  }
};

// ─── Data layers ───────────────────────────────────────────────────────────

// GET /api/admin/layers
const listLayers = async (req, res) => {
  try {
    res.json(await describeLayers());
  } catch (error) {
    res.status(500).json({ message: 'Server error listing layers' });
  }
};

// POST /api/admin/layers/:layer/import  { records: [...], dryRun, source }
const importLayer = async (req, res) => {
  try {
    const layer = LAYERS[req.params.layer];
    if (!layer) return res.status(404).json({ message: 'Unknown layer' });

    const { records, dryRun = false, source = 'json' } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No records to import' });
    }
    if (records.length > MAX_IMPORT_ROWS) {
      return res.status(400).json({ message: `Import at most ${MAX_IMPORT_ROWS} rows at a time` });
    }

    const valid = [];
    const validRows = [];
    const invalid = [];
    const seenKeys = new Set();
    records.forEach((raw, i) => {
      const { doc, errors } = normalizeRecord(layer, raw);
      if (layer.uniqueKey && doc[layer.uniqueKey]) {
        if (seenKeys.has(doc[layer.uniqueKey])) errors.push(`Duplicate ${layer.uniqueKey} "${doc[layer.uniqueKey]}" in this file`);
        seenKeys.add(doc[layer.uniqueKey]);
      }
      if (errors.length) invalid.push({ row: i + 1, errors });
      else {
        valid.push(doc);
        validRows.push(i + 1);
      }
    });

    // Layer-specific checks that need the database (e.g. funding must point at a real intervention)
    if (layer.resolve && valid.length) {
      const problems = await layer.resolve(valid.map((doc, i) => ({ doc, row: validRows[i] })));
      const keep = problems.map((problem, i) => {
        if (problem) invalid.push({ row: validRows[i], errors: [problem] });
        return !problem;
      });
      const keptDocs = valid.filter((_, i) => keep[i]);
      const keptRows = validRows.filter((_, i) => keep[i]);
      valid.splice(0, valid.length, ...keptDocs);
      validRows.splice(0, validRows.length, ...keptRows);
      invalid.sort((a, b) => a.row - b.row);
    }

    if (dryRun) {
      let existing = 0;
      if (layer.uniqueKey) {
        const keys = valid.map((d) => d[layer.uniqueKey]).filter(Boolean);
        existing = keys.length ? await layer.model.countDocuments({ [layer.uniqueKey]: { $in: keys } }) : 0;
      }
      return res.json({ total: records.length, valid: valid.length, invalid, willUpdate: existing, preview: valid.slice(0, 5) });
    }

    if (valid.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import', invalid });
    }

    let inserted = 0;
    let updated = 0;
    const items = valid.map((doc, i) => ({ doc, row: validRows[i] }));
    const keyed = layer.uniqueKey ? items.filter((it) => it.doc[layer.uniqueKey]) : [];
    const unkeyed = layer.uniqueKey ? items.filter((it) => !it.doc[layer.uniqueKey]) : items;
    // With ordered: false the database saves every row it can; rows it rejects are reported, not fatal
    const rejected = (err, batch) => {
      if (!Array.isArray(err?.writeErrors)) throw err;
      err.writeErrors.forEach((we) => {
        invalid.push({ row: batch[we.index]?.row, errors: [`Could not be saved: ${we.errmsg || we.err?.errmsg || 'database error'}`] });
      });
    };

    if (keyed.length) {
      const ops = keyed.map(({ doc }) => ({
        updateOne: { filter: { [layer.uniqueKey]: doc[layer.uniqueKey] }, update: { $set: doc }, upsert: true },
      }));
      let result;
      try {
        result = await layer.model.bulkWrite(ops, { ordered: false });
      } catch (err) {
        rejected(err, keyed);
        result = err.result || {};
      }
      inserted += result.upsertedCount || 0;
      updated += result.matchedCount || 0;
    }
    if (unkeyed.length) {
      try {
        const docs = await layer.model.insertMany(unkeyed.map((it) => it.doc), { ordered: false });
        inserted += docs.length;
      } catch (err) {
        rejected(err, unkeyed);
        inserted += err.insertedDocs?.length || 0;
      }
    }
    invalid.sort((a, b) => a.row - b.row);

    await logAudit(req, {
      action: records.length === 1 ? 'layer.add_record' : 'layer.import',
      targetType: 'layer',
      targetId: req.params.layer,
      targetLabel: layer.label,
      changes: {
        source,
        rows: records.length,
        inserted,
        updated,
        failed: invalid.length,
        sample: valid.slice(0, 3).map((d) => d[layer.uniqueKey] || d.name || d.projName || d.wellName || d.location),
        ...(req.params.layer === 'funding' ? { totalAmount: valid.reduce((sum, d) => sum + (d.amount || 0), 0) } : {}),
      },
    });

    res.json({ inserted, updated, invalid });
  } catch (error) {
    console.error('Layer import error:', error);
    res.status(500).json({ message: 'Server error importing data', error: error.message });
  }
};

// GET /api/flood-hotspots (public)
const getFloodHotspots = async (req, res) => {
  try {
    res.json(await FloodHotspot.find().lean());
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching flood hotspots' });
  }
};

module.exports = {
  suspendUser,
  activateUser,
  createResetLink,
  forceLogout,
  inviteUser,
  getAuditLogs,
  getFailedLogins,
  listLayers,
  importLayer,
  getFloodHotspots,
};
