const express = require('express');
const router = express.Router();
const {
  getOverviewSummary,
  getCorporationSummary,
  getWardSummary
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/authMiddleware');

// Secure all analytics routes with jwt auth protection
router.get('/overview', protect, getOverviewSummary);
router.get('/corporation', protect, getCorporationSummary);
router.get('/ward', protect, getWardSummary);

module.exports = router;
