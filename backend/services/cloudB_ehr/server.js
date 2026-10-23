require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const ehrRoutes = require('./routes/ehr.routes');
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
    clientCertificate: req.mtls.clientCert,
    timestamp: new Date().toISOString()
  });
});

// Mount modular routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/ehr', ehrRoutes);

// Load SSL/TLS certificates
const options = {
  key: fs.readFileSync(serverKeyPath),
  cert: fs.readFileSync(serverCertPath),
  ca: fs.readFileSync(caCertPath),
  requestCert: true,          // 🔒 Require mTLS client cert
  rejectUnauthorized: true    // 🔒 Reject any connection not signed by Root CA!
};

const PORT = process.env.CLOUD_B_PORT || 5002;
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`☁️ Cloud B (GCP Patient & EHR Service) listening on HTTPS port ${PORT} with ENFORCED mTLS 🔒`);
});
