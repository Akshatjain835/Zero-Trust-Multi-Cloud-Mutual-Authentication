const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  specialty: { type: String, required: true },
  department: { type: String, required: true },
  assignedPatients: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
