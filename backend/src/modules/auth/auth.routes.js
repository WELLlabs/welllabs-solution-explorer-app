const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  completeProfile,
  getAllUsers,
  updateUserRole,
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

module.exports = router;
