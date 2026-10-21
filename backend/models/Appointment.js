const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
  notes: { type: String, default: 'Consultation scheduled.' },
  mTLSHandshakeId: { type: String, default: () => `mtls-tx-${Math.floor(10000 + Math.random() * 90000)}` }
}, { timestamps: true });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
