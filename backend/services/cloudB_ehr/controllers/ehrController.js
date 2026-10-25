const store = require('../store');

// Vitals controllers
exports.getPatientVitals = async (req, res) => {
  const vitals = await store.getPatientVitals(req.params.patientId);
  res.json({
    patientId: req.params.patientId,
    vitals,
    count: vitals.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.addPatientVitals = async (req, res) => {
  const { patientId } = req.params;
  const { heartRate, bloodPressure, spO2, temperature, notes, recordedBy, doctorId } = req.body;

  if (!heartRate || !bloodPressure) {
    return res.status(400).json({ error: 'Heart rate and blood pressure are required' });
  }

  // Calculate clinical status
  let status = 'NORMAL';
  const hr = Number(heartRate);
  const spo2Num = Number(spO2);
  if (hr > 110 || hr < 50 || spo2Num < 92) {
    status = 'CRITICAL';
  } else if (hr > 95 || spo2Num < 95) {
    status = 'ELEVATED';
  }

  const newVitals = await store.addVitals({
    patientId,
    heartRate: hr,
    bloodPressure,
    spO2: spo2Num || 98,
    temperature: Number(temperature) || 98.6,
    notes: notes || 'Routine clinical vitals captured.',
    recordedBy: recordedBy || 'Assigned Physician',
    doctorId: doctorId || null,
    status
  });

  res.status(201).json({
    message: 'Patient clinical vitals recorded in Cloud B',
    vitals: newVitals,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

// Prescriptions controllers
exports.getPatientPrescriptions = async (req, res) => {
  const rxList = await store.getPatientPrescriptions(req.params.patientId);
  res.json({
    patientId: req.params.patientId,
    prescriptions: rxList,
    count: rxList.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.addPrescription = async (req, res) => {
  const { patientId } = req.params;
  const { medication, dosage, frequency, duration, instructions, prescribedBy, doctorId } = req.body;

  if (!medication || !dosage || !frequency) {
    return res.status(400).json({ error: 'Medication, dosage, and frequency are required' });
  }

  const newRx = await store.addPrescription({
    patientId,
    medication,
    dosage,
    frequency,
    duration: duration || '30 days',
    instructions: instructions || 'Take as directed by doctor.',
    prescribedBy: prescribedBy || 'Consulting Physician',
    doctorId: doctorId || null,
    status: 'ACTIVE'
  });

  res.status(201).json({
    message: 'Prescription issued in Cloud B (GCP EHR)',
    prescription: newRx,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.updatePrescriptionStatus = async (req, res) => {
  const { rxId } = req.params;
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'DISPENSED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = await store.updatePrescriptionStatus(rxId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  res.json({
    message: `Prescription ${rxId} status updated to ${status}`,
    prescription: updated,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

