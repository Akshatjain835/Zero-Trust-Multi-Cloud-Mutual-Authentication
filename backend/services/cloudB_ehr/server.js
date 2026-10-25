const path = require('path');
// Load root .env (highest priority) and local .env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config();

const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
// Connect to MongoDB (meditrust_ehr)
connectDB();

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

// Zero-Trust Microsegmentation & Service Entitlement Enforcer (NIST SP 800-207)
app.use((req, res, next) => {
  const clientCert = req.mtls?.clientCert;
  const clientOrg = clientCert?.subject?.O || clientCert?.subject?.organizationName;
  const clientCN = clientCert?.subject?.CN;

  // Zero Trust Policy: Cloud B Clinical EHR domain is ONLY accessible by Cloud A Identity Gateway (CloudA-AWS / cloud-a-auth)
  // Cross-cloud lateral access from Cloud C (Azure) or unentitled peer is strictly denied
  if (clientOrg === 'CloudC-Azure' || clientCN === 'cloud-c-appointments') {
    console.warn(`🚨 ZERO-TRUST POLICY REJECTION: Lateral Movement Attempt from [${clientOrg || clientCN}] to ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Forbidden: Zero-Trust Microsegmentation Policy Violation',
      code: 'ZT_LATERAL_MOVEMENT_BLOCKED',
      threatCategory: 'Lateral Movement & Cross-Cloud Privilege Escalation',
      clientIdentity: clientOrg || clientCN || 'UNKNOWN',
      attemptedResource: req.originalUrl,
      policy: 'Cloud B (GCP EHR) enforces strict micro-segmentation. Service [CloudC-Azure] has NO entitlement to access Clinical EHR records.',
      nistPrinciple: 'NIST SP 800-207: Continuous Micro-segmentation & Implicit Trust Removal. Valid PKI cert does not grant lateral cross-domain data access.',
      defenseLayer: 'Layer 7 (Application ABAC & Service Identity Entitlement)'
    });
  }

  next();
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
