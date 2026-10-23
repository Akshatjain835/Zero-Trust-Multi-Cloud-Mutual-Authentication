const mtlsClient = require('../services/mtlsClient');
const userStore = require('../store/userStore');

// Register Patient (Admin only) -> Sends payload over mTLS to Cloud B (GCP)
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, age, gender, bloodGroup, primaryDoctorId, diagnosis } = req.body;

    // 1. Create Patient in Cloud B (GCP) over mTLS
    const cloudBResponse = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/patients`,
      { name, email, age, gender, bloodGroup, primaryDoctorId, diagnosis }
    );

    const createdPatient = cloudBResponse.data.patient;

    // 2. Register credentials in Cloud A auth store
    userStore.addUser({
      id: `usr-${createdPatient.id}`,
      email,
      password: password || 'patient123',
      name,
      role: 'PATIENT',
      patientId: createdPatient.id
    });

    res.status(201).json({
      message: 'Patient registered successfully across Cloud A & Cloud B via mTLS',
      patient: createdPatient,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error registering patient:', err.message);
    res.status(500).json({ error: 'Failed to communicate with Cloud B over mTLS', details: err.message });
  }
};

// Register Doctor (Admin only) -> Sends payload over mTLS to Cloud B (GCP)
exports.registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialty, department } = req.body;

    // 1. Create Doctor in Cloud B (GCP) over mTLS
    const cloudBResponse = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/doctors`,
      { name, email, specialty, department }
    );

    const createdDoctor = cloudBResponse.data.doctor;

    // 2. Register credentials in Cloud A auth store
    userStore.addUser({
      id: `usr-${createdDoctor.id}`,
      email,
      password: password || 'doctor123',
      name,
      role: 'DOCTOR',
      doctorId: createdDoctor.id
    });

    res.status(201).json({
      message: 'Doctor registered successfully across Cloud A & Cloud B via mTLS',
      doctor: createdDoctor,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error registering doctor:', err.message);
    res.status(500).json({ error: 'Failed to communicate with Cloud B over mTLS', details: err.message });
  }
};

// Get clinical system metrics (cross-cloud aggregation)
exports.getSystemMetrics = async (req, res) => {
  try {
    const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
      mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/patients`),
      mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/doctors`),
      mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/appointments`)
    ]);

    res.json({
      totalUsers: userStore.users.length,
      totalPatients: patientsRes.data.patients?.length || 0,
      totalDoctors: doctorsRes.data.doctors?.length || 0,
      totalAppointments: appointmentsRes.data.appointments?.length || 0,
      patients: patientsRes.data.patients,
      doctors: doctorsRes.data.doctors,
      appointments: appointmentsRes.data.appointments,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error aggregating system metrics over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to aggregate cross-cloud metrics via mTLS', details: err.message });
  }
};
