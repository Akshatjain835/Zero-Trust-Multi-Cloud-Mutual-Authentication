const store = require('../store');

exports.getAllDoctors = async (req, res) => {
  const doctors = await store.getDoctors();
  res.json({
    doctors,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorById = async (req, res) => {
  const doctor = await store.getDoctor(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found in Cloud B records' });
  }
  res.json({
    doctor,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorPatients = async (req, res) => {
  const doctorPatients = await store.getDoctorPatients(req.params.id);
  res.json({
    doctorId: req.params.id,
    patients: doctorPatients,
    totalPatients: doctorPatients.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.registerDoctor = async (req, res) => {
  const { name, email, specialty, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newDoctor = await store.addDoctor({
    name,
    email,
    specialty: specialty || 'General Medicine',
    department: department || 'Outpatient Clinic'
  });

  res.status(201).json({
    message: 'Doctor registered successfully in Cloud B (GCP EHR)',
    doctor: newDoctor,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

