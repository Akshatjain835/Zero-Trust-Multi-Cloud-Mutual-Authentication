const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, default: '30 days' },
  instructions: { type: String, default: '' },
  doctorId: { type: String, default: null },
  prescribedBy: { type: String, default: 'Attending Physician' },
  prescribedAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['ACTIVE', 'DISPENSED', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
