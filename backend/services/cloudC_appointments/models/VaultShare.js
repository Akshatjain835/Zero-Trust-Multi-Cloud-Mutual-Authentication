const mongoose = require('mongoose');

const VaultShareSchema = new mongoose.Schema({
  x: { type: Number, required: true, unique: true },
  yHex: { type: String, required: true },
  cloud: { type: String, default: 'Cloud C (Azure)' },
  role: { type: String, default: 'Appointments & Immutable Audit Ledger' },
  storedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VaultShare', VaultShareSchema);
