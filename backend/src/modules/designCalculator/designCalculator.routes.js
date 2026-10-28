const express = require('express');
const { getRunoff } = require('./designCalculator.controller');

const router = express.Router();

router.get('/runoff', getRunoff);

module.exports = router;
