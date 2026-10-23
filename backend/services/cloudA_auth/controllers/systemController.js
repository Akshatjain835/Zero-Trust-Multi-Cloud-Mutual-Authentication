const https = require('https');
const axios = require('axios');
const mtlsClient = require('../services/mtlsClient');

// 3-Cloud Health & Topology status
exports.getSystemHealth = async (req, res) => {
  const health = {
    cloudA: { service: 'Cloud A - AWS Auth Gateway', status: 'ACTIVE', port: 5001 },
    cloudB: { service: 'Cloud B - GCP EHR', status: 'UNKNOWN', mtlsVerified: false },
    cloudC: { service: 'Cloud C - Azure Appointments', status: 'UNKNOWN', mtlsVerified: false },
    auditLogs: []
  };

  try {
    const resB = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/health`);
    health.cloudB = { status: 'ACTIVE', ...resB.data };
  } catch (err) {
    health.cloudB.status = 'UNREACHABLE';
    health.cloudB.error = err.message;
  }

  try {
    const resC = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/health`);
    health.cloudC = { status: 'ACTIVE', ...resC.data };
  } catch (err) {
    health.cloudC.status = 'UNREACHABLE';
    health.cloudC.error = err.message;
  }

  try {
    const resAudit = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/audit-logs`);
    health.auditLogs = resAudit.data.auditLogs;
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
  }

  res.json(health);
};

// ZERO-TRUST SIMULATOR: Send raw request without mTLS client cert directly to Cloud B or C
exports.simulateAttack = async (req, res) => {
  const { targetService } = req.body; // 'CloudB' or 'CloudC'
  const targetUrl = targetService === 'CloudB'
    ? `${mtlsClient.cloudBUrl}/api/patients`
    : `${mtlsClient.cloudCUrl}/api/appointments`;

  // Create an HTTPS agent WITHOUT client certificate (untrusted rogue client)
  const untrustedAgent = new https.Agent({
    rejectUnauthorized: false // Don't block client-side, let server enforce it!
  });

  try {
    console.log(`💥 SIMULATING DIRECT UNTRUSTED ATTACK to ${targetUrl} without mTLS cert...`);
    const response = await axios.get(targetUrl, { httpsAgent: untrustedAgent, timeout: 5000 });
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
};
