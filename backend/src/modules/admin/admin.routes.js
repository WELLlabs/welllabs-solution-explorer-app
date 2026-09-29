const express = require('express');
const { protect, admin } = require('../../middleware/authMiddleware');
const c = require('./admin.controller');

const router = express.Router();
router.use(protect, admin);

router.post('/users/invite', c.inviteUser);
router.post('/users/:id/suspend', c.suspendUser);
router.post('/users/:id/activate', c.activateUser);
router.post('/users/:id/reset-link', c.createResetLink);
router.post('/users/:id/force-logout', c.forceLogout);

router.get('/audit', c.getAuditLogs);
router.get('/failed-logins', c.getFailedLogins);

router.get('/layers', c.listLayers);
router.post('/layers/:layer/import', c.importLayer);

module.exports = router;
