const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { corsOptions } = require('./config/cors');

const app = express();

// Behind one nginx proxy in production; lets req.ip (used by the admin login
// rate limiter) be the real client IP instead of nginx's.
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
// Larger limit so admins can bulk import CSV / GeoJSON data layers
app.use(express.json({ limit: '10mb' }));

// Domain Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.get('/api/flood-hotspots', require('./modules/admin/admin.controller').getFloodHotspots);
app.use('/api/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/sites', require('./modules/sites/sites.routes'));

// Basic Route
app.get('/', (req, res) => {
  res.send('🚀 Bangalore MERN API is running...');
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is connected to frontend!',
    timestamp: new Date()
  });
});

module.exports = app;
