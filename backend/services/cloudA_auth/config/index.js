require('dotenv').config();
const path = require('path');

const certsDir = path.join(__dirname, '..', '..', '..', 'certs');

module.exports = {
  port: process.env.PORT || process.env.CLOUD_A_PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'zero-trust-multi-cloud-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cloudBUrl: process.env.CLOUD_B_URL || 'https://localhost:5002',
  cloudCUrl: process.env.CLOUD_C_URL || 'https://localhost:5003',
  certsDir,
  certs: {
    caPath: process.env.CA_CERT_PATH || path.join(certsDir, 'ca.crt'),
    clientCertPath: process.env.CLIENT_CERT_PATH || path.join(certsDir, 'cloudA.crt'),
    clientKeyPath: process.env.CLIENT_KEY_PATH || path.join(certsDir, 'cloudA.key')
  }
};
