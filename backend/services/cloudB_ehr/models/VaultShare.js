const mongoose = require('mongoose');

const VaultShareSchema = new mongoose.Schema({
  x: { type: Number, required: true, unique: true },
  yHex: { type: String, required: true },
  cloud: { type: String, default: 'Cloud B (GCP)' },
  role: { type: String, default: 'Clinical Electronic Health Records' },
  storedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VaultShare', VaultShareSchema);
