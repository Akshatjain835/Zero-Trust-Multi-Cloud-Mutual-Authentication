const store = require('../store');

exports.getAllPatients = async (req, res) => {
  const patients = await store.getPatients();
  res.json({
    patients,
    mtlsVerified: req.mtls?.isAuthorized || false,
    client: req.mtls?.clientCert?.subject?.CN || 'unknown'
  });
};

exports.getPatientById = async (req, res) => {
  const patient = await store.getPatient(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found in Cloud B records' });
  }
  res.json({
    patient,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.registerPatient = async (req, res) => {
  const { name, email, age, gender, bloodGroup, primaryDoctorId, diagnosis } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newPatient = await store.addPatient({
    name,
    email,
    age: Number(age) || 30,
    gender: gender || 'Unspecified',
    bloodGroup: bloodGroup || 'O+',
    primaryDoctorId: primaryDoctorId || null,
    diagnosis: diagnosis || 'General Wellness'
  });

  res.status(201).json({
    message: 'Patient record created successfully in Cloud B (GCP EHR)',
    patient: newPatient,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

