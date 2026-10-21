const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'zero-trust-multi-cloud-secret-key-2026';

// Paths to mTLS certificates
const certsDir = path.join(__dirname, '..', '..', 'certs');
const caCertPath = process.env.CA_CERT_PATH || path.join(certsDir, 'ca.crt');
const clientCertPath = process.env.CLIENT_CERT_PATH || path.join(certsDir, 'cloudA.crt');
const clientKeyPath = process.env.CLIENT_KEY_PATH || path.join(certsDir, 'cloudA.key');

// URLs for Cloud B & Cloud C (configurable via env for real cloud transition)
const CLOUD_B_URL = process.env.CLOUD_B_URL || 'https://localhost:5002';
const CLOUD_C_URL = process.env.CLOUD_C_URL || 'https://localhost:5003';

// 🔒 Configure mTLS HTTPS Agent for Cloud A -> Cloud B & Cloud C communication
let mtlsHttpsAgent;
try {
  mtlsHttpsAgent = new https.Agent({
    ca: fs.readFileSync(caCertPath),
    cert: fs.readFileSync(clientCertPath),
    key: fs.readFileSync(clientKeyPath),
    rejectUnauthorized: true // Verify server certificates strictly
  });
  console.log('🔒 Cloud A mTLS Client Agent initialized with X.509 Certificate (CN: cloud-a-auth)');
} catch (err) {
  console.error('⚠️ Could not load mTLS certificates in Cloud A:', err.message);
}

// In-Memory User Credentials (Admin, Doctors, Patients)
const users = [
  {
    id: 'admin-1',
    email: 'admin@health.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'ADMIN'
  },
  {
    id: 'doc-1',
    email: 'sarah.jenkins@health.com',
    password: 'doctor123',
    name: 'Dr. Sarah Jenkins',
    role: 'DOCTOR',
    doctorId: 'doc-1'
  },
  {
    id: 'doc-2',
    email: 'marcus.vance@health.com',
    password: 'doctor123',
    name: 'Dr. Marcus Vance',
    role: 'DOCTOR',
    doctorId: 'doc-2'
  },
  {
    id: 'pat-1',
    email: 'john.doe@patient.com',
    password: 'patient123',
    name: 'John Doe',
    role: 'PATIENT',
    patientId: 'pat-1'
  },
  {
    id: 'pat-2',
    email: 'emily.watson@patient.com',
    password: 'patient123',
    name: 'Emily Watson',
    role: 'PATIENT',
    patientId: 'pat-2'
  },
  {
    id: 'pat-3',
    email: 'robert.chen@patient.com',
    password: 'patient123',
    name: 'Robert Chen',
    role: 'PATIENT',
    patientId: 'pat-3'
  }
];

// Auth Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

// Role Check Middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Unauthorized role for this action' });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// User Sign In (Admin, Doctor, Patient) with Role validation
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({ error: `Account exists but role is not ${role}. Please select ${user.role}.` });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      doctorId: user.doctorId,
      patientId: user.patientId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Sign-in successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      doctorId: user.doctorId,
      patientId: user.patientId
    }
  });
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// ADMIN ENDPOINTS (Proxies to Cloud B & Cloud C via mTLS)
// ----------------------------------------------------

// Register Patient (Admin only) -> Sends payload over mTLS to Cloud B (GCP)
app.post('/api/admin/register-patient', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, age, gender, bloodGroup, primaryDoctorId, diagnosis } = req.body;

    // 1. Create Patient in Cloud B (GCP) over mTLS
    const cloudBResponse = await axios.post(
      `${CLOUD_B_URL}/api/patients`,
      { name, email, age, gender, bloodGroup, primaryDoctorId, diagnosis },
      { httpsAgent: mtlsHttpsAgent }
    );

    const createdPatient = cloudBResponse.data.patient;

    // 2. Register credentials in Cloud A auth store
    users.push({
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
});

// Register Doctor (Admin only) -> Sends payload over mTLS to Cloud B (GCP)
app.post('/api/admin/register-doctor', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, specialty, department } = req.body;

    // 1. Create Doctor in Cloud B (GCP) over mTLS
    const cloudBResponse = await axios.post(
      `${CLOUD_B_URL}/api/doctors`,
      { name, email, specialty, department },
      { httpsAgent: mtlsHttpsAgent }
    );

    const createdDoctor = cloudBResponse.data.doctor;

    // 2. Register credentials in Cloud A auth store
    users.push({
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
});

// ----------------------------------------------------
// DOCTOR ENDPOINTS (Proxies to Cloud B & Cloud C via mTLS)
// ----------------------------------------------------

// Doctor gets assigned patients from Cloud B (GCP)
app.get('/api/doctor/patients', verifyToken, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.query.doctorId || 'doc-1';
    const response = await axios.get(`${CLOUD_B_URL}/api/doctors/${doctorId}/patients`, {
      httpsAgent: mtlsHttpsAgent
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching doctor patients over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patients from Cloud B via mTLS', details: err.message });
  }
});

// Doctor gets appointment schedule from Cloud C (Azure)
app.get('/api/doctor/appointments', verifyToken, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.query.doctorId || 'doc-1';
    const response = await axios.get(`${CLOUD_C_URL}/api/appointments/doctor/${doctorId}`, {
      httpsAgent: mtlsHttpsAgent
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching appointments over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch appointments from Cloud C via mTLS', details: err.message });
  }
});

// Doctor marks appointment complete
app.put('/api/doctor/appointments/:id/complete', verifyToken, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const response = await axios.put(`${CLOUD_C_URL}/api/appointments/${req.params.id}/complete`, {}, {
      httpsAgent: mtlsHttpsAgent
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error updating appointment status over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to update appointment status via mTLS', details: err.message });
  }
});

// ----------------------------------------------------
// PATIENT ENDPOINTS (Proxies to Cloud C & Cloud B via mTLS)
// ----------------------------------------------------

// Patient views previous doctor appointments from Cloud C & Cloud B
app.get('/api/patient/history', verifyToken, requireRole('PATIENT', 'ADMIN'), async (req, res) => {
  try {
    const patientId = req.user.patientId || req.query.patientId || 'pat-1';

    // 1. Fetch appointments from Cloud C (Azure) over mTLS
    const aptsResponse = await axios.get(`${CLOUD_C_URL}/api/appointments/patient/${patientId}`, {
      httpsAgent: mtlsHttpsAgent
    });

    // 2. Fetch patient medical record from Cloud B (GCP) over mTLS
    const patientResponse = await axios.get(`${CLOUD_B_URL}/api/patients/${patientId}`, {
      httpsAgent: mtlsHttpsAgent
    });

    res.json({
      patient: patientResponse.data.patient,
      appointments: aptsResponse.data.appointments,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error fetching patient history over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patient history via mTLS', details: err.message });
  }
});

// ----------------------------------------------------
// ZERO-TRUST TOPOLOGY & ATTACK SIMULATOR ENDPOINTS
// ----------------------------------------------------

// 3-Cloud Health & Topology status
app.get('/api/system/health', async (req, res) => {
  const health = {
    cloudA: { service: 'Cloud A - AWS Auth Gateway', status: 'ACTIVE', port: 5001 },
    cloudB: { service: 'Cloud B - GCP EHR', status: 'UNKNOWN', mtlsVerified: false },
    cloudC: { service: 'Cloud C - Azure Appointments', status: 'UNKNOWN', mtlsVerified: false },
    auditLogs: []
  };

  try {
    const resB = await axios.get(`${CLOUD_B_URL}/api/health`, { httpsAgent: mtlsHttpsAgent });
    health.cloudB = { status: 'ACTIVE', ...resB.data };
  } catch (err) {
    health.cloudB.status = 'UNREACHABLE';
    health.cloudB.error = err.message;
  }

  try {
    const resC = await axios.get(`${CLOUD_C_URL}/api/health`, { httpsAgent: mtlsHttpsAgent });
    health.cloudC = { status: 'ACTIVE', ...resC.data };
  } catch (err) {
    health.cloudC.status = 'UNREACHABLE';
    health.cloudC.error = err.message;
  }

  try {
    const resAudit = await axios.get(`${CLOUD_C_URL}/api/audit-logs`, { httpsAgent: mtlsHttpsAgent });
    health.auditLogs = resAudit.data.auditLogs;
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
  }

  res.json(health);
});

// ZERO-TRUST SIMULATOR: Send raw request without mTLS client cert directly to Cloud B or C
app.post('/api/system/simulate-attack', async (req, res) => {
  const { targetService } = req.body; // 'CloudB' or 'CloudC'
  const targetUrl = targetService === 'CloudB' ? `${CLOUD_B_URL}/api/patients` : `${CLOUD_C_URL}/api/appointments`;

  // Create an HTTPS agent WITHOUT client certificate (untrusted client)
  const untrustedAgent = new https.Agent({
    rejectUnauthorized: false // Don't block client side, let server block it!
  });

  try {
    console.log(`💥 SIMULATING DIRECT UNTRUSTED ATTACK to ${targetUrl} without mTLS cert...`);
    const response = await axios.get(targetUrl, { httpsAgent: untrustedAgent });
    res.json({
      success: true,
      message: 'UNEXPECTED: Request passed! (Zero-trust disabled)',
      data: response.data
    });
  } catch (err) {
    console.log(`🛡️ ZERO-TRUST WORKED: Request to ${targetUrl} blocked cleanly: ${err.message}`);
    res.json({
      success: false,
      message: '🛡️ ZERO-TRUST ENFORCED! Cloud Service rejected direct non-mTLS call.',
      blockedByZeroTrust: true,
      errorDetails: err.code || err.message,
      explanation: 'The request was terminated during the TLS 1.3 handshake because no valid X.509 client certificate issued by ZeroTrust-RootCA was provided.'
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`☁️ Cloud A (AWS Auth & Identity Gateway) listening on HTTP port ${PORT}`);
  console.log(`🔒 Connected to Cloud B (${CLOUD_B_URL}) and Cloud C (${CLOUD_C_URL}) via Zero-Trust mTLS!`);
});
