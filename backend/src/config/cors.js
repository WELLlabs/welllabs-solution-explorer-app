const allowedOrigins = [
  'http://localhost:5173',             // For local development
  'http://localhost:3000',             // For local preview
  'https://climatesolutions.ai',       // Production frontend
  'https://blr.climatesolutions.ai',   // Bangalore frontend
  'https://beta.climatesolutions.ai',  // Beta frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      /^https?:\/\/([a-zA-Z0-9-]+\.)*climatesolutions\.ai$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};
