const mtlsClient = require('../services/mtlsClient');

// Helper to resolve doctor ID from token or query (if admin)
function resolveDoctorId(req) {
  if (req.user.role === 'DOCTOR') {
    return req.user.doctorId || 'doc-1';
  }
  return req.query.doctorId || req.user.doctorId || 'doc-1';
}

// Doctor gets assigned patients from Cloud B (GCP)
exports.getAssignedPatients = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/doctors/${doctorId}/patients`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching doctor patients over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patients from Cloud B via mTLS', details: err.message });
  }
};

// Doctor gets appointment schedule from Cloud C (Azure)
exports.getAppointments = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/appointments/doctor/${doctorId}`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching appointments over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch appointments from Cloud C via mTLS', details: err.message });
  }
};

// Doctor marks appointment complete in Cloud C
exports.completeAppointment = async (req, res) => {
  try {
    const response = await mtlsClient.axios.put(`${mtlsClient.cloudCUrl}/api/appointments/${req.params.id}/complete`);
    res.json(response.data);
  } catch (err) {
    console.error('Error completing appointment over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to complete appointment via mTLS', details: err.message });
  }
};

// Doctor gets patient vitals from Cloud B
exports.getPatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching vitals over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patient vitals from Cloud B', details: err.message });
  }
};

// Doctor records new vitals in Cloud B
exports.recordPatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`,
      {
        ...req.body,
        doctorId,
        recordedBy: req.user.name || 'Attending Physician'
      }
    );
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Error recording vitals over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to record vitals via Cloud B mTLS', details: err.message });
  }
};

// Doctor gets patient prescriptions from Cloud B
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching prescriptions over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch prescriptions from Cloud B', details: err.message });
  }
};

// Doctor issues new prescription in Cloud B
exports.issuePrescription = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`,
      {
        ...req.body,
        doctorId,
        prescribedBy: req.user.name || 'Attending Physician'
      }
    );
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Error issuing prescription over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to issue prescription via Cloud B mTLS', details: err.message });
  }
};
