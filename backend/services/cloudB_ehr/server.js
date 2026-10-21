const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

const certsDir = path.join(__dirname, '..', '..', 'certs');
const caCertPath = process.env.CA_CERT_PATH || path.join(certsDir, 'ca.crt');
const serverCertPath = process.env.SERVER_CERT_PATH || path.join(certsDir, 'cloudB.crt');
const serverKeyPath = process.env.SERVER_KEY_PATH || path.join(certsDir, 'cloudB.key');

// Middleware to verify mTLS client certificate details
app.use((req, res, next) => {
  // If request came through mTLS HTTPS listener:
  const clientCert = req.socket.getPeerCertificate ? req.socket.getPeerCertificate() : null;
  const isAuthorized = req.clientIsAuthorized || (req.socket.authorized !== undefined ? req.socket.authorized : false);

  req.mtls = {
    isAuthorized,
    clientCert: clientCert && Object.keys(clientCert).length > 0 ? {
      subject: clientCert.subject,
      issuer: clientCert.issuer,
      validFrom: clientCert.valid_from,
      validTo: clientCert.valid_to,
      fingerprint: clientCert.fingerprint
    } : null
  };

  next();
});

// Health & Zero-Trust Audit endpoint
app.get('/api/health', (req, res) => {
  res.json({
    service: 'Cloud B - GCP Patient & EHR Service',
    status: 'ACTIVE',
    zeroTrustMode: 'ENFORCED',
    mtlsVerified: req.mtls.isAuthorized,
    clientCertificate: req.mtls.clientCert
  });
});

// Get all doctors
app.get('/api/doctors', (req, res) => {
  res.json({ doctors: store.doctors, mtlsVerified: req.mtls.isAuthorized });
});

// Get doctor's assigned patients
app.get('/api/doctors/:id/patients', (req, res) => {
  const doctorPatients = store.getDoctorPatients(req.params.id);
  res.json({ patients: doctorPatients, mtlsVerified: req.mtls.isAuthorized });
});

// Get all patients
app.get('/api/patients', (req, res) => {
  res.json({ patients: store.patients, mtlsVerified: req.mtls.isAuthorized });
});

// Get single patient
app.get('/api/patients/:id', (req, res) => {
  const patient = store.patients.find((p) => p.id === req.params.id || p.email === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json({ patient, mtlsVerified: req.mtls.isAuthorized });
});

// Admin register patient
app.post('/api/patients', (req, res) => {
  const newPatient = store.addPatient(req.body);
  res.status(201).json({ message: 'Patient registered successfully in Cloud B', patient: newPatient });
});

// Admin register doctor
app.post('/api/doctors', (req, res) => {
  const newDoctor = store.addDoctor(req.body);
  res.status(201).json({ message: 'Doctor registered successfully in Cloud B', doctor: newDoctor });
});

// Load SSL/TLS certificates
const options = {
  key: fs.readFileSync(serverKeyPath),
  cert: fs.readFileSync(serverCertPath),
  ca: fs.readFileSync(caCertPath),
  requestCert: true,          // 🔒 Require mTLS client cert
  rejectUnauthorized: true    // 🔒 Reject any connection not signed by Root CA!
};

const PORT = process.env.PORT || 5002;

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`☁️ Cloud B (GCP Patient & EHR Service) listening on HTTPS port ${PORT} with ENFORCED mTLS 🔒`);
});
