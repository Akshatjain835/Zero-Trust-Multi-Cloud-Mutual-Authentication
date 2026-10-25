const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_EHR_URI || (
  process.env.MONGODB_URI 
    ? `${process.env.MONGODB_URI.replace(/\/$/, '')}/meditrust_ehr` 
    : 'mongodb://127.0.0.1:27017/meditrust_ehr'
);

async function connectDB() {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Cloud B (GCP EHR) connected to MongoDB: ${conn.connection.name} (${conn.connection.host})`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Cloud B could not connect to MongoDB at ${mongoUri}: ${err.message}`);
    console.warn(`⚠️ Running with resilient fallback cache.`);
    return false;
  }
}

module.exports = {
  connectDB,
  mongoUri
};
