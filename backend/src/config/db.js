const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose.set('bufferCommands', false); // Disable command buffering to prevent hanging queries when offline
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 45000, // Wait up to 45 seconds to find the MongoDB server on a slow network
    });
    console.log(`✅ MongoDB Connected`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
  }
};

module.exports = connectDB;
