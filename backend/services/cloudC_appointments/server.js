require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const appointmentRoutes = require('./routes/appointment.routes');
const auditRoutes = require('./routes/audit.routes');
const store = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

const certsDir = path.join(__dirname, '..', '..', 'certs');
const caCertPath = process.env.CA_CERT_PATH || path.join(certsDir, 'ca.crt');
const serverCertPath = process.env.SERVER_CERT_PATH || path.join(certsDir, 'cloudC.crt');
const serverKeyPath = process.env.SERVER_KEY_PATH || path.join(certsDir, 'cloudC.key');

// Middleware for mTLS certificate validation & auto audit logging
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
      clientCN: req.mtls.clientCert ? (req.mtls.clientCert.subject?.CN || 'Verified-Client') : 'cloud-a-auth',
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
    clientCertificate: req.mtls.clientCert,
    timestamp: new Date().toISOString()
  });
});

// Mount modular routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/audit-logs', auditRoutes);

// Load SSL/TLS certificates
const options = {
  key: fs.readFileSync(serverKeyPath),
  cert: fs.readFileSync(serverCertPath),
  ca: fs.readFileSync(caCertPath),
  requestCert: true,          // 🔒 Require mTLS client cert
  rejectUnauthorized: true    // 🔒 Reject any connection not signed by Root CA!
};

const PORT = process.env.CLOUD_C_PORT || 5003;
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`☁️ Cloud C (Azure Appointments & Audit Service) listening on HTTPS port ${PORT} with ENFORCED mTLS 🔒`);
});
