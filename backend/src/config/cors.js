const allowedOrigins = [
  'http://localhost:5173',             // For local development
  'https://climatesolutions.ai',       // Production frontend
  'https://blr.climatesolutions.ai',   // Bangalore frontend
  // 'https://api.climatesolutions.ai'
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};
