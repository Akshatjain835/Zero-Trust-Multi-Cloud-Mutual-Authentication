const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  notes: { type: String, default: '' },
  mTLSHandshakeId: { type: String, default: '' },
  cancellationReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
