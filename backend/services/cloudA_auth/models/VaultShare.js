const mongoose = require('mongoose');

const VaultShareSchema = new mongoose.Schema({
  x: { type: Number, required: true, unique: true },
  yHex: { type: String, required: true },
  cloud: { type: String, default: 'Cloud A (AWS)' },
  role: { type: String, default: 'Identity & Authentication Gateway' },
  storedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VaultShare', VaultShareSchema);
