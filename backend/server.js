const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = [
  'http://localhost:5173',             // For local development
  'https://climatesolutions.ai',       // Production frontend
  'https://blr.climatesolutions.ai',   // Bangalore frontend
  'https://api.climatesolutions.ai'
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
console.log('🔐 Auth routes mounted');
app.use('/api/analytics', require('./routes/analyticsRoutes'));
console.log('📊 Analytics routes mounted');

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

// ── Start: connect to MongoDB first, then open the HTTP port ──────────────
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 45000, // Wait up to 45 s to find MongoDB
    });
    console.log('✅ MongoDB Connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`📡 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Crash fast so systemd can restart the service
  }
})();

