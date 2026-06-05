const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Options
mongoose.set('bufferCommands', false); // Disable command buffering to prevent hanging queries when offline

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 45000, // Wait up to 45 seconds to find the MongoDB server on a slow network
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Server running on http://localhost:${PORT}`);
});

