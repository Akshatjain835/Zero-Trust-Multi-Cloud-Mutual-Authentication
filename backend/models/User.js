const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'DOCTOR', 'PATIENT'], required: true },
  doctorId: { type: String, default: null },
  patientId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
