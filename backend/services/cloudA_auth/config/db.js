const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Cloud A (AWS Auth) connected to MongoDB: ${conn.connection.name} (${conn.connection.host})`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Cloud A could not connect to MongoDB at ${config.mongoUri}: ${err.message}`);
    console.warn(`⚠️ Running with resilient fallback cache.`);
    return false;
  }
}

module.exports = connectDB;
