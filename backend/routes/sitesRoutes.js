const express = require('express');
const router = express.Router();
const SiteProject = require('../models/SiteProject');
const Intervention = require('../models/Intervention');

/**
 * GET /api/sites
 * Returns all SiteProject documents with their linked interventions embedded.
 */
router.get('/', async (req, res) => {
  try {
    const sites = await SiteProject.find({}).lean();

    // Embed interventions for each site
    const siteIds = sites.map(s => s.site_id);
    const interventions = await Intervention.find({ site_id: { $in: siteIds } }).lean();

    // Group interventions by site_id
    const bySite = {};
    interventions.forEach(iv => {
      if (!bySite[iv.site_id]) bySite[iv.site_id] = [];
      bySite[iv.site_id].push(iv);
    });

    const sitesWithInterventions = sites.map(s => ({
      ...s,
      interventions: bySite[s.site_id] || [],
    }));

    res.json(sitesWithInterventions);
  } catch (err) {
    console.error('GET /api/sites error:', err);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

/**
 * GET /api/sites/:site_id
 * Returns one SiteProject with its interventions embedded.
 */
router.get('/:site_id', async (req, res) => {
  try {
    const site = await SiteProject.findOne({ site_id: req.params.site_id }).lean();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const interventions = await Intervention.find({ site_id: req.params.site_id }).lean();
    res.json({ ...site, interventions });
  } catch (err) {
    console.error('GET /api/sites/:site_id error:', err);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
});

module.exports = router;
