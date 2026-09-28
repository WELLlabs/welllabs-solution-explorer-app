const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  googleAuth,
  completeProfile,
  getAllUsers,
  updateUserRole,
  updateUser,
  deleteUser,
  getMe,
  logout,
} = require('./auth.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

router.post('/register', (req, res) => {
  console.log('📝 Register request received');
  register(req, res);
});

router.post('/login', (req, res) => {
  console.log('🔐 Login request received');
  login(req, res);
});

// 5 failed attempts per IP every 15 minutes; successful logins don't count.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many admin login attempts. Please try again in 15 minutes.' },
});

router.post('/admin/login', adminLoginLimiter, adminLogin);

router.post('/google', (req, res) => {
  console.log('🌐 Google auth request received');
  googleAuth(req, res);
});

router.post('/complete-profile', (req, res) => {
  console.log('📋 Complete profile request received');
  completeProfile(req, res);
});

router.get('/me', protect, (req, res) => {
  console.log('🔍 Me request for user', req.user?.email);
  getMe(req, res);
});

router.post('/logout', (req, res) => {
  console.log('🚪 Logout request');
  logout(req, res);
});

// Admin Routes
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
