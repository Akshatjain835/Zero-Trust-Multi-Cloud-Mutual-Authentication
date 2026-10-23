const store = require('../store');

exports.getAllDoctors = (req, res) => {
  res.json({
    doctors: store.doctors,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorById = (req, res) => {
  const doctor = store.getDoctor(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found in Cloud B records' });
  }
  res.json({
    doctor,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorPatients = (req, res) => {
  const doctorPatients = store.getDoctorPatients(req.params.id);
  res.json({
    doctorId: req.params.id,
    patients: doctorPatients,
    totalPatients: doctorPatients.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.registerDoctor = (req, res) => {
  const { name, email, specialty, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newDoctor = store.addDoctor({
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
