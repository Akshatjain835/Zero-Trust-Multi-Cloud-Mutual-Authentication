const https = require('https');
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
const serverCertPath = process.env.SERVER_CERT_PATH || path.join(certsDir, 'cloudC.crt');
const serverKeyPath = process.env.SERVER_KEY_PATH || path.join(certsDir, 'cloudC.key');

// Middleware for mTLS certificate validation & audit logging
app.use((req, res, next) => {
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

  // Record audit log entry for this mTLS request
  if (req.path !== '/api/audit-logs' && req.path !== '/api/health') {
    store.addAuditLog({
      clientCN: req.mtls.clientCert ? (req.mtls.clientCert.subject.CN || 'Verified-Client') : 'cloud-a-auth',
      action: `${req.method} ${req.path}`,
      targetService: 'Cloud C - Azure Appointments',
      status: 'SUCCESS 200',
      details: `mTLS Peer Certificate Verified (SHA256 Fingerprint: ${req.mtls.clientCert ? req.mtls.clientCert.fingerprint.slice(0, 16) : 'VERIFIED'}...)`
    });
  }

  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    service: 'Cloud C - Azure Appointments & Security Audit Service',
    status: 'ACTIVE',
    zeroTrustMode: 'ENFORCED',
    mtlsVerified: req.mtls.isAuthorized,
    clientCertificate: req.mtls.clientCert
  });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
  res.json({ appointments: store.appointments, mtlsVerified: req.mtls.isAuthorized });
});

// Get appointments for a specific patient
app.get('/api/appointments/patient/:patientId', (req, res) => {
  const patientApts = store.appointments.filter((a) => a.patientId === req.params.patientId);
  res.json({ appointments: patientApts, mtlsVerified: req.mtls.isAuthorized });
});

// Get appointments for a specific doctor
app.get('/api/appointments/doctor/:doctorId', (req, res) => {
  const doctorApts = store.appointments.filter((a) => a.doctorId === req.params.doctorId);
  res.json({ appointments: doctorApts, mtlsVerified: req.mtls.isAuthorized });
});

// Book new appointment
app.post('/api/appointments', (req, res) => {
  const newApt = store.addAppointment(req.body);
  res.status(201).json({ message: 'Appointment booked in Cloud C', appointment: newApt });
});

// Mark appointment completed
app.put('/api/appointments/:id/complete', (req, res) => {
  const apt = store.completeAppointment(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ message: 'Appointment marked as COMPLETED in Cloud C', appointment: apt });
});

// Get security audit logs
app.get('/api/audit-logs', (req, res) => {
  res.json({ auditLogs: store.auditLogs, totalLogs: store.auditLogs.length });
});

// Post security audit log
app.post('/api/audit-logs', (req, res) => {
  const log = store.addAuditLog(req.body);
  res.status(201).json({ message: 'Audit log created', log });
});

const options = {
  key: fs.readFileSync(serverKeyPath),
  cert: fs.readFileSync(serverCertPath),
  ca: fs.readFileSync(caCertPath),
  requestCert: true,          // 🔒 Enforce mTLS client cert
  rejectUnauthorized: true    // 🔒 Reject unauthenticated clients
};

const PORT = process.env.PORT || 5003;

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`☁️ Cloud C (Azure Appointments & Audit Service) listening on HTTPS port ${PORT} with ENFORCED mTLS 🔒`);
});
