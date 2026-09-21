const express = require('express');
const router = express.Router();
const { getAllSites, getSiteById } = require('./sites.controller');

router.get('/', getAllSites);
router.get('/:site_id', getSiteById);

module.exports = router;
