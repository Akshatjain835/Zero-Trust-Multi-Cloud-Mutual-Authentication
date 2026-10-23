const mtlsClient = require('../services/mtlsClient');

// Helper to resolve patient ID from token or query (if admin/doctor)
function resolvePatientId(req) {
  if (req.user.role === 'PATIENT') {
    return req.user.patientId || 'pat-1';
  }
  return req.query.patientId || req.user.patientId || 'pat-1';
}

// Patient views overall medical history from Cloud B & Cloud C
exports.getMedicalHistory = async (req, res) => {
  try {
    const patientId = resolvePatientId(req);

    // 1. Fetch appointments from Cloud C (Azure) over mTLS
    const aptsPromise = mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/appointments/patient/${patientId}`);

    // 2. Fetch patient record from Cloud B (GCP) over mTLS
    const patientPromise = mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/patients/${patientId}`);

    // 3. Fetch patient vitals from Cloud B
    const vitalsPromise = mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`);

    // 4. Fetch patient prescriptions from Cloud B
    const rxPromise = mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`);

    const [aptsRes, patientRes, vitalsRes, rxRes] = await Promise.all([
      aptsPromise,
      patientPromise,
      vitalsPromise,
      rxPromise
    ]);

    res.json({
      patient: patientRes.data.patient,
      appointments: aptsRes.data.appointments || [],
      vitals: vitalsRes.data.vitals || [],
      prescriptions: rxRes.data.prescriptions || [],
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error fetching patient history over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patient history via mTLS', details: err.message });
  }
};

// Patient books a new appointment in Cloud C (Azure)
exports.bookAppointment = async (req, res) => {
  try {
    const patientId = resolvePatientId(req);
    const { doctorId, doctorName, department, date, time, notes } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'doctorId, date, and time are required to book an appointment' });
    }

    const response = await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/appointments`, {
      patientId,
      patientName: req.user.name || 'Registered Patient',
      doctorId,
      doctorName: doctorName || 'Attending Physician',
      department: department || 'General Medicine',
      date,
      time,
      notes: notes || 'Booked via Patient Portal',
      clientCN: 'cloud-a-auth'
    });

    res.status(201).json(response.data);
  } catch (err) {
    console.error('Error booking appointment over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to schedule appointment in Cloud C via mTLS', details: err.message });
  }
};

// Patient gets list of doctors to choose from when booking
exports.getAvailableDoctors = async (req, res) => {
  try {
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/doctors`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching doctors list over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch doctors list from Cloud B via mTLS', details: err.message });
  }
};
