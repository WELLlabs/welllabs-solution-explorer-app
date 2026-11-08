const express = require('express');
const { protect, admin } = require('../../middleware/authMiddleware');
const c = require('./projectSubmission.controller');

const router = express.Router();

// Consultant submissions (Requires authentication)
router.post('/', protect, c.submitProject);
router.get('/my', protect, c.getMySubmissions);
router.put('/:id', protect, c.updateProject);

// Admin review & approval (Requires admin role)
router.get('/admin', protect, admin, c.getAdminSubmissions);
router.post('/admin/:id/approve', protect, admin, c.approveSubmission);
router.post('/admin/:id/reject', protect, admin, c.rejectSubmission);
router.post('/admin/:id/suggest', protect, admin, c.suggestImprovement);

module.exports = router;

