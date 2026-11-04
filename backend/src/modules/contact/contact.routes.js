const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { protect } = require('../../middleware/authMiddleware');
const { sendConsultantInterest } = require('./contact.controller');

const router = express.Router();

const interestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many interest emails. Please try again in an hour.' },
});

router.post('/consultant-interest', protect, interestLimiter, sendConsultantInterest);

module.exports = router;
