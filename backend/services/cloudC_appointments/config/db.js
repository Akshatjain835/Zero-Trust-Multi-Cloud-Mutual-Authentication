const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_APPOINTMENTS_URI || (
  process.env.MONGODB_URI 
    ? `${process.env.MONGODB_URI.replace(/\/$/, '')}/meditrust_appointments` 
    : 'mongodb://127.0.0.1:27017/meditrust_appointments'
);

async function connectDB() {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Cloud C (Azure Appointments & Audit) connected to MongoDB: ${conn.connection.name} (${conn.connection.host})`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Cloud C could not connect to MongoDB at ${mongoUri}: ${err.message}`);
    console.warn(`⚠️ Running with resilient fallback cache.`);
    return false;
  }
}

module.exports = {
  connectDB,
  mongoUri
};
