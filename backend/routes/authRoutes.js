const express = require('express');
const router = express.Router();
const { register, login, getAllUsers, updateUserRole, getMe, logout } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

// Admin Routes
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);

module.exports = router;
