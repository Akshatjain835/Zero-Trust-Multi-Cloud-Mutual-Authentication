const https = require('https');
const fs = require('fs');
const axios = require('axios');
const config = require('../config');

let mtlsHttpsAgent;
try {
  mtlsHttpsAgent = new https.Agent({
    ca: fs.readFileSync(config.certs.caPath),
    cert: fs.readFileSync(config.certs.clientCertPath),
    key: fs.readFileSync(config.certs.clientKeyPath),
    rejectUnauthorized: true // Strictly verify peer against Root CA
  });
  console.log('🔒 Cloud A mTLS Client Agent initialized with X.509 Certificate (CN: cloud-a-auth)');
} catch (err) {
  console.error('⚠️ Could not initialize Cloud A mTLS certificates:', err.message);
}

// Axios instance configured with mTLS agent
const mtlsAxios = axios.create({
  httpsAgent: mtlsHttpsAgent,
  timeout: 10000
});

module.exports = {
  agent: mtlsHttpsAgent,
  axios: mtlsAxios,
  cloudBUrl: config.cloudBUrl,
  cloudCUrl: config.cloudCUrl
};
