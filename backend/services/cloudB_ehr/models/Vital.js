const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  heartRate: { type: Number, required: true },
  bloodPressure: { type: String, required: true },
  spO2: { type: Number, required: true },
  temperature: { type: Number, required: true },
  recordedBy: { type: String, default: 'Attending Physician' },
  doctorId: { type: String, default: null },
  recordedAt: { type: String, default: () => new Date().toISOString() },
  status: { type: String, enum: ['OPTIMAL', 'NORMAL', 'ELEVATED', 'CRITICAL'], default: 'NORMAL' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vital', VitalSchema);
