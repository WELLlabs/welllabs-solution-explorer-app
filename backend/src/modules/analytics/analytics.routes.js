const express = require('express');
const router = express.Router();
const {
  getOverviewSummary,
  getCorporationSummary,
  getWardSummary,
  getProjectsList,
  getWellsList
} = require('./analytics.controller');

router.get('/overview', getOverviewSummary);
router.get('/corporation', getCorporationSummary);
router.get('/ward', getWardSummary);
router.get('/projects', getProjectsList);
router.get('/wells', getWellsList);

module.exports = router;
