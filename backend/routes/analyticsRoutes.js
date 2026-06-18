const express = require('express');
const router = express.Router();
const {
  getOverviewSummary,
  getCorporationSummary,
  getWardSummary,
  getProjectsList,
  getWellsList
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/authMiddleware');

// Secure all analytics routes with jwt auth protection
// router.get('/overview', protect, getOverviewSummary);
// router.get('/corporation', protect, getCorporationSummary);
// router.get('/ward', protect, getWardSummary);
router.get('/overview', getOverviewSummary);
router.get('/corporation', getCorporationSummary);
router.get('/ward', getWardSummary);
router.get('/projects', getProjectsList);
router.get('/wells', getWellsList);

module.exports = router;
