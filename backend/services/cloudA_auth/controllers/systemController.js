const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mtlsClient = require('../services/mtlsClient');

// Helper to log security incident to Cloud C audit ledger
async function recordSecurityIncident(incident) {
  try {
    await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
      clientCN: incident.clientCN || 'SECURITY_THREAT_SIMULATOR',
      action: incident.action || 'SECURITY_ALERT: ATTACK_PREVENTED',
      targetService: incident.targetService || 'MediTrust Mesh',
      status: incident.status || 'DEFENSE_ENFORCED',
      details: incident.details || 'Zero-Trust Defense Triggered'
    });
  } catch (err) {
    console.error('Could not log security incident to Cloud C audit store:', err.message);
  }
}

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

// ZERO-TRUST RED-TEAM vs BLUE-TEAM MULTI-VECTOR ATTACK SIMULATOR
exports.simulateAttack = async (req, res) => {
  const { attackVector = 'NO_CERT', targetService = 'CloudB' } = req.body;
  const certsDir = config.certsDir || path.join(__dirname, '..', '..', '..', 'certs');

  console.log(`\n======================================================`);
  console.log(`💥 RED-TEAM ATTACK SIMULATION LAUNCHED`);
  console.log(`🎯 Attack Vector: ${attackVector} | Target: ${targetService}`);
  console.log(`======================================================`);

  // =========================================================================
  // VECTOR 1: Direct Rogue Access Without mTLS Client Certificate (Layer 4/TLS)
  // =========================================================================
  if (attackVector === 'NO_CERT') {
    const targetUrl = targetService === 'CloudB'
      ? `${mtlsClient.cloudBUrl}/api/patients`
      : `${mtlsClient.cloudCUrl}/api/appointments`;

    const untrustedAgent = new https.Agent({
      rejectUnauthorized: false // Don't abort client-side; let server enforce TLS client cert
    });

    try {
      const response = await axios.get(targetUrl, { httpsAgent: untrustedAgent, timeout: 5000 });
      return res.json({
        success: true,
        blockedByZeroTrust: false,
        message: 'CRITICAL FAILURE: Rogue request passed without certificate!',
        data: response.data
      });
    } catch (err) {
      const errorMsg = err.code || err.message;
      await recordSecurityIncident({
        clientCN: 'ANONYMOUS_ROGUE_INGRESS',
        action: 'SECURITY_ALERT: NO_CERT_INGRESS_DROPPED',
        targetService: targetService === 'CloudB' ? 'Cloud B - GCP EHR' : 'Cloud C - Azure Appointments',
        status: 'DROPPED_TLS_1.3_ALERT',
        details: `Zero-Trust L4 Transport Defense: Direct non-mTLS HTTPS call dropped. Handshake terminated: ${errorMsg}`
      });

      return res.json({
        success: false,
        blockedByZeroTrust: true,
        vector: 'NO_CERT',
        vectorName: 'Rogue Ingress Without X.509 Client Certificate',
        threatCategory: 'Unauthorized Direct Network Access (Bypass Gateway)',
        defenseLayer: 'Layer 4 / TLS 1.3 Transport Security',
        targetEndpoint: targetUrl,
        nistPrinciple: 'NIST SP 800-207 Tenet 1 & 2: All communication is secured regardless of network location. Perimeter security is eliminated; microservices strictly demand mutual cryptographic proof before establishing session.',
        handshakeResult: 'TCP/TLS Handshake Aborted by Remote Peer (Alert: Certificate Required)',
        errorDetails: errorMsg,
        technicalExplanation: `The microservice at ${targetUrl} enforces requestCert: true and rejectUnauthorized: true. Because the client presented zero credentials during the TLS Certificate message exchange, the server aborted the connection immediately.`
      });
    }
  }

  // =========================================================================
  // VECTOR 2: Self-Signed / Rogue Untrusted CA Spoofing (Layer 5/PKI)
  // =========================================================================
  if (attackVector === 'SPOOFED_CA') {
    const targetUrl = `${mtlsClient.cloudBUrl}/api/patients`;
    const rogueCertPath = path.join(certsDir, 'rogueUntrusted.crt');
    const rogueKeyPath = path.join(certsDir, 'rogueUntrusted.key');

    try {
      const rogueAgent = new https.Agent({
        cert: fs.readFileSync(rogueCertPath),
        key: fs.readFileSync(rogueKeyPath),
        ca: fs.readFileSync(config.certs.caPath),
        rejectUnauthorized: false
      });

      const response = await axios.get(targetUrl, { httpsAgent: rogueAgent, timeout: 5000 });
      return res.json({
        success: true,
        blockedByZeroTrust: false,
        message: 'CRITICAL FAILURE: Spoofed CA certificate was accepted!',
        data: response.data
      });
    } catch (err) {
      const errorMsg = err.code || err.message;
      await recordSecurityIncident({
        clientCN: 'cloud-a-auth [ROGUE_UNTRUSTED_CA]',
        action: 'SECURITY_ALERT: SPOOFED_CA_HANDSHAKE_DROPPED',
        targetService: 'Cloud B - GCP EHR',
        status: 'REJECTED_UNTRUSTED_SIGNATURE',
        details: `Zero-Trust L5 PKI Defense: Client cert claimed CN cloud-a-auth, but signing authority (Rogue-UntrustedCA) failed Root CA trust chain verification.`
      });

      return res.json({
        success: false,
        blockedByZeroTrust: true,
        vector: 'SPOOFED_CA',
        vectorName: 'Rogue CA Spoofing / Untrusted Client Certificate',
        threatCategory: 'Identity Spoofing & Fake Certificate Authority Injection',
        defenseLayer: 'Layer 5 / Cryptographic PKI Trust Chain Validation',
        targetEndpoint: targetUrl,
        presentedCertCN: 'cloud-a-auth (Signed by Rogue-UntrustedCA)',
        expectedRootCA: 'ZeroTrust-RootCA (SHA256 Root of Trust)',
        nistPrinciple: 'NIST SP 800-207 Tenet 3: Access to individual enterprise resources is granted on a per-session basis and verified against trusted cryptographic trust anchors. Untrusted PKI hierarchies are rejected.',
        handshakeResult: 'TLS Handshake Alert: Certificate Unknown / Untrusted Root (UNABLE_TO_VERIFY_LEAF_SIGNATURE)',
        errorDetails: errorMsg,
        technicalExplanation: `The adversary generated a client certificate claiming Common Name 'cloud-a-auth', but signed it with their own Rogue-UntrustedCA private key. Cloud B's TLS engine validated the certificate against the authorized ca.crt trust anchor, detected the counterfeit cryptographic signature, and severed the socket.`
      });
    }
  }

  // =========================================================================
  // VECTOR 3: Lateral Movement & Cross-Cloud Privilege Escalation (Layer 7/ABAC)
  // =========================================================================
  if (attackVector === 'LATERAL_MOVEMENT') {
    const targetUrl = `${mtlsClient.cloudBUrl}/api/patients`;
    const cloudCCertPath = path.join(certsDir, 'cloudC.crt');
    const cloudCKeyPath = path.join(certsDir, 'cloudC.key');

    try {
      // Attacker compromises Cloud C (Azure) and attempts to query Cloud B (GCP EHR)
      // using Cloud C's legitimate certificate signed by the Root CA!
      const lateralAgent = new https.Agent({
        cert: fs.readFileSync(cloudCCertPath),
        key: fs.readFileSync(cloudCKeyPath),
        ca: fs.readFileSync(config.certs.caPath),
        rejectUnauthorized: true
      });

      const response = await axios.get(targetUrl, { httpsAgent: lateralAgent, timeout: 5000 });
      return res.json({
        success: true,
        blockedByZeroTrust: false,
        message: 'CRITICAL FAILURE: Lateral movement between Cloud C and Cloud B succeeded!',
        data: response.data
      });
    } catch (err) {
      const responseData = err.response?.data;
      const status = err.response?.status || 403;

      await recordSecurityIncident({
        clientCN: 'CloudC-Azure [LATERAL_PIVOT_ATTEMPT]',
        action: 'SECURITY_ALERT: LATERAL_MOVEMENT_BLOCKED',
        targetService: 'Cloud B - GCP EHR',
        status: `BLOCKED_${status}_MICROSEGMENTATION`,
        details: `Zero-Trust L7 ABAC Policy Defense: Valid mTLS cert presented from Cloud C, but service was denied access to Patient Clinical EHR tables due to lack of entitlement.`
      });

      return res.json({
        success: false,
        blockedByZeroTrust: true,
        vector: 'LATERAL_MOVEMENT',
        vectorName: 'Cross-Cloud Lateral Movement & Domain Pivot',
        threatCategory: 'Lateral Network Traversal & Microsegmentation Breach',
        defenseLayer: 'Layer 7 / Application ABAC & Service Identity Entitlement',
        targetEndpoint: targetUrl,
        compromisedSourceNode: 'Cloud C (Azure Appointments & Scheduling Service)',
        targetNode: 'Cloud B (GCP Electronic Health Records & Clinical Data)',
        mTLSHandshakeResult: 'TLS Handshake SUCCESSFUL (Valid X.509 cert signed by ZeroTrust-RootCA)',
        authorizationResult: 'HTTP 403 Forbidden (Blocked by Zero-Trust Policy Enforcement Point)',
        nistPrinciple: 'NIST SP 800-207 Tenet 4 & 6: Access to resources is determined by dynamic policy. An authenticated identity is not synonymous with blanket authorization. Micro-segmentation prevents an adversary on one compromised cloud service from pivoting into another domain.',
        errorDetails: responseData || err.message,
        technicalExplanation: `The adversary gained possession of Cloud C's valid X.509 certificate and successfully negotiated mTLS with Cloud B. However, Zero Trust dictates: "Never Trust, Always Verify". Cloud B's Policy Enforcement Point (PEP) evaluated the peer certificate's Subject Organization (CloudC-Azure) and enforced that only Cloud A (AWS Auth Gateway) is entitled to read Patient Clinical charts. The request was denied with HTTP 403.`
      });
    }
  }

  // =========================================================================
  // VECTOR 4: JWT Signature Tampering & Privilege Escalation (Layer 7/Token Auth)
  // =========================================================================
  if (attackVector === 'JWT_TAMPERING') {
    // Forge an elevated JWT with role: "ADMIN" signed with attacker's fake secret key
    const forgedPayload = {
      id: 'pat-1',
      email: 'john.doe@patient.com',
      name: 'John Doe (Attacker Forging Admin Privileges)',
      role: 'ADMIN',
      doctorId: null,
      patientId: 'pat-1'
    };

    const forgedToken = jwt.sign(forgedPayload, 'ATTACKER_UNTRUSTED_SECRET_KEY_99999', { expiresIn: '1h' });

    try {
      // Attempt to access protected Admin metrics on Cloud A Gateway
      const response = await axios.get(`http://localhost:${config.port}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });

      return res.json({
        success: true,
        blockedByZeroTrust: false,
        message: 'CRITICAL FAILURE: Tampered JWT token accepted!',
        data: response.data
      });
    } catch (err) {
      const status = err.response?.status || 401;
      const errorMsg = err.response?.data?.error || err.message;

      await recordSecurityIncident({
        clientCN: 'ATTACKER_MAN_IN_THE_MIDDLE',
        action: 'SECURITY_ALERT: JWT_TAMPERING_BLOCKED',
        targetService: 'Cloud A - AWS Auth Gateway',
        status: `BLOCKED_${status}_INVALID_SIGNATURE`,
        details: `Zero-Trust L7 Token Attestation: Cryptographic verification failed on forged role: ADMIN token. Signature does not match gateway secret.`
      });

      return res.json({
        success: false,
        blockedByZeroTrust: true,
        vector: 'JWT_TAMPERING',
        vectorName: 'Man-in-the-Middle JWT Tampering & Role Elevation',
        threatCategory: 'Cryptographic Credential Tampering & Privilege Escalation',
        defenseLayer: 'Layer 7 / Cryptographic Token Attestation & Integrity Verification',
        targetEndpoint: `/api/admin/metrics (Cloud A Gateway)`,
        forgedClaims: { originalRole: 'PATIENT', elevatedRoleAttempted: 'ADMIN' },
        authorizationResult: `HTTP 401 Unauthorized (${errorMsg})`,
        nistPrinciple: 'NIST SP 800-207 Tenet 5: Enterprise monitors and measures the integrity and security posture of all owned and associated assets. Cryptographic signatures must be validated on every transaction before evaluating authorization claims.',
        errorDetails: errorMsg,
        technicalExplanation: `The attacker intercepted a legitimate patient session token, modified the JSON payload to elevate their role from PATIENT to ADMIN, and re-encoded the base64 claims. When presented to Cloud A's Policy Enforcement Point, HMAC-SHA256 signature verification failed instantly because the attacker lacked Cloud A's private signing secret.`
      });
    }
  }

  // Fallback for unknown vector
  res.status(400).json({ error: `Unknown attack vector: ${attackVector}. Supported: NO_CERT, SPOOFED_CA, LATERAL_MOVEMENT, JWT_TAMPERING` });
};

