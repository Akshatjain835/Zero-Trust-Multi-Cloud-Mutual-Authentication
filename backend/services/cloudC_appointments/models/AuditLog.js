const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  clientCN: { type: String, default: 'cloud-a-auth' },
  issuer: { type: String, default: 'ZeroTrust-RootCA' },
  action: { type: String, required: true },
  targetService: { type: String, default: 'Cloud C - Azure Appointments' },
  status: { type: String, default: 'SUCCESS 200' },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
