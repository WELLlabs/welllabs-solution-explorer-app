const express = require('express');
const { protect, admin } = require('../../middleware/authMiddleware');
const c = require('./projectSubmission.controller');

const router = express.Router();

// Consultant submissions (Requires authentication)
router.post('/', protect, c.submitProject);
router.get('/my', protect, c.getMySubmissions);

// Admin review & approval (Requires admin role)
router.get('/admin', protect, admin, c.getAdminSubmissions);
router.post('/admin/:id/approve', protect, admin, c.approveSubmission);
router.post('/admin/:id/reject', protect, admin, c.rejectSubmission);

module.exports = router;

