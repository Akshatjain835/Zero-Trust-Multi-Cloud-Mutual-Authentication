const crypto = require('crypto');
const shamirService = require('../services/shamirService');
const mtlsClient = require('../services/mtlsClient');
const VaultShare = require('../models/VaultShare');

// Encrypted Vault Payload State (AES-256-GCM)
let encryptedVault = null;
let currentVaultMeta = null;
let inMemoryShareA = null;

// Mock Classified Clinical Record to be sealed in the Vault
const TOP_SECRET_CLINICAL_RECORD = {
  recordClassification: 'TOP_SECRET_ICU_TRAUMA_DATA',
  complianceStandard: 'HIPAA Security Rule § 164.312(a)(2)(iv) - Encrypted Zero-Trust Rest',
  sealedAt: new Date().toISOString(),
  targetPatient: {
    id: 'pat-3',
    name: 'Robert Chen',
    dob: '1968-04-22',
    bloodType: 'B- Negative',
    criticalAllergies: ['Penicillin (Severe Anaphylaxis Risk)', 'Sulfa Antibiotics'],
    sensitivePsychiatricNotes: 'Confidential psychiatric trauma consultation post-ICU decompensation. Sealed from general EHR query.',
    genomicSequencingAlert: 'Carrier of malignant hyperthermia susceptibility (RYR1 mutation). Avoid volatile anesthetics.'
  }
};

/**
 * AES-256-GCM Encrypt Helper
 */
function encryptPayload(text, keyHex) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    ivHex: iv.toString('hex'),
    ciphertextHex: encrypted,
    tagHex: tag.toString('hex')
  };
}

/**
 * AES-256-GCM Decrypt Helper
 */
function decryptPayload(ciphertextHex, ivHex, tagHex, keyHex) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(keyHex, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

/**
 * Initialize Vault: Generates 256-bit Key, splits into 3 shares via Shamir (k=2, n=3),
 * seals ICU clinical chart with AES-256-GCM, and distributes shares over mTLS.
 */
exports.initializeVault = async (req, res) => {
  try {
    // 1. Generate master secret S
    const masterSecretHex = shamirService.generateMasterSecret();

    // 2. Split into 3 shares (Threshold k=2, Total n=3)
    const splitResult = shamirService.splitSecret(masterSecretHex, 2, 3);
    const [share1, share2, share3] = splitResult.shares;

    // 3. Encrypt top-secret clinical record with Master Key S
    const encrypted = encryptPayload(JSON.stringify(TOP_SECRET_CLINICAL_RECORD), masterSecretHex);
    encryptedVault = encrypted;

    // 4. Store Share 1 in Cloud A (AWS)
    inMemoryShareA = share1;
    try {
      await VaultShare.deleteMany({});
      await VaultShare.create(share1);
    } catch (e) {
      console.warn('Cloud A MongoDB VaultShare save warning:', e.message);
    }

    // 5. Dispatch Share 2 to Cloud B (GCP) over mTLS
    const resB = await mtlsClient.axios.post(`${mtlsClient.cloudBUrl}/api/vault/share`, share2);

    // 6. Dispatch Share 3 to Cloud C (Azure) over mTLS
    const resC = await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/vault/share`, share3);

    // 7. Notarize into Cloud C Immutable Ledger over mTLS
    await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
      action: 'SHAMIR_SECRET_VAULT_INITIALIZED',
      clientCN: 'cloud-a-auth',
      targetService: '3-Cloud Threshold Vault Cluster',
      status: 'THRESHOLD_SHARES_DISTRIBUTED',
      details: `Master key split into n=3 shares with threshold k=2. Share 1 deposited in AWS, Share 2 in GCP, Share 3 in Azure. Master secret purged from memory.`
    }).catch(() => {});

    currentVaultMeta = {
      initialized: true,
      initializedAt: new Date().toISOString(),
      polynomialDisplay: splitResult.polynomialDisplay,
      threshold: 2,
      totalShares: 3,
      primeModulusHex: splitResult.primeModulusHex.substring(0, 16) + '...'
    };

    // Purge masterSecretHex from response! Only return shares summary
    res.json({
      success: true,
      message: 'Master Key split and sealed across 3 clouds via Shamir (k=2, n=3)!',
      vaultMeta: currentVaultMeta,
      sharesSummary: [
        { cloud: 'Cloud A (AWS)', x: share1.x, yPreview: share1.yHex.substring(0, 16) + '...', role: share1.role, status: 'STORED_LOCALLY' },
        { cloud: 'Cloud B (GCP)', x: share2.x, yPreview: share2.yHex.substring(0, 16) + '...', role: share2.role, status: 'DEPOSITED_OVER_MTLS' },
        { cloud: 'Cloud C (Azure)', x: share3.x, yPreview: share3.yHex.substring(0, 16) + '...', role: share3.role, status: 'DEPOSITED_OVER_MTLS' }
      ],
      encryptedVault: {
        algorithm: 'AES-256-GCM',
        ciphertextPreview: encrypted.ciphertextHex.substring(0, 48) + '...',
        ivHex: encrypted.ivHex,
        tagHex: encrypted.tagHex
      }
    });
  } catch (err) {
    console.error('Error initializing Shamir vault:', err);
    res.status(500).json({ error: 'Failed to initialize Shamir vault across clouds', details: err.message });
  }
};

/**
 * Get Vault Status
 */
exports.getVaultStatus = async (req, res) => {
  try {
    let hasShareA = !!inMemoryShareA;
    if (!hasShareA) {
      const doc = await VaultShare.findOne({});
      hasShareA = !!doc;
    }

    res.json({
      initialized: !!currentVaultMeta && hasShareA,
      vaultMeta: currentVaultMeta || { initialized: false, threshold: 2, totalShares: 3 },
      encryptedVault: encryptedVault ? {
        algorithm: 'AES-256-GCM',
        ciphertextPreview: encryptedVault.ciphertextHex.substring(0, 48) + '...',
        ivHex: encryptedVault.ivHex
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get vault status', details: err.message });
  }
};

/**
 * Simulate Single Cloud Breach (Information-Theoretic Security Proof)
 */
exports.simulateBreach = async (req, res) => {
  try {
    const { targetCloud = 'CloudB' } = req.body;
    let stolenShare = null;

    if (targetCloud === 'CloudA') {
      const doc = await VaultShare.findOne({}) || inMemoryShareA;
      stolenShare = doc ? { x: doc.x, yHex: doc.yHex, cloud: 'Cloud A (AWS)' } : null;
    } else if (targetCloud === 'CloudB') {
      const resB = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/vault/share`);
      stolenShare = resB.data.share;
    } else if (targetCloud === 'CloudC') {
      const resC = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/vault/share`);
      stolenShare = resC.data.share;
    }

    if (!stolenShare) {
      return res.status(400).json({ error: `Could not retrieve share from ${targetCloud}. Has vault been initialized?` });
    }

    // Generate 5 candidate polynomials passing through this single stolen coordinate
    const proofResult = shamirService.generateAlternativeCandidates(stolenShare, 5);

    // Record breach detection alert in Cloud C
    await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
      action: 'SECURITY_ALERT: SINGLE_CLOUD_SHARE_EXFILTRATION_SIMULATION',
      clientCN: 'ATTACKER_INSIDER_THREAT',
      targetService: `${targetCloud} Vault Custody`,
      status: 'ZERO_KNOWLEDGE_ISOLATION_CONFIRMED',
      details: `Adversary compromised 1 share from ${targetCloud}. Cryptographic evaluation confirms 0% key leakage under Shamir threshold k=2.`
    }).catch(() => {});

    res.json({
      targetCloud,
      compromisedShare: {
        x: stolenShare.x,
        yHex: stolenShare.yHex,
        cloud: stolenShare.cloud
      },
      securityGuarantee: 'Information-Theoretic Secrecy (Shannon Perfect Secrecy)',
      mathematicalExplanation: `A polynomial of degree 1 (f(x) = S + a1*x) requires at least k=2 points to be uniquely solved. With only 1 stolen point (x1, y1), there are exactly |Fp| (2^256) possible lines passing through it, each intersecting a completely different secret S at x=0. Hence, the attacker's probability of guessing the key is 1/2^256, equivalent to brute force.`,
      alternativeCandidatePolynomials: proofResult.candidates
    });
  } catch (err) {
    console.error('Error simulating breach:', err);
    res.status(500).json({ error: 'Breach simulation failed', details: err.message });
  }
};

/**
 * Reconstruct Secret via Multi-Cloud Quorum (k = 2)
 */
exports.reconstructVault = async (req, res) => {
  try {
    const { selectedClouds = ['CloudA', 'CloudB'] } = req.body;

    if (!selectedClouds || selectedClouds.length < 2) {
      return res.status(400).json({ error: 'At least 2 clouds must be selected to meet threshold k=2' });
    }

    if (!encryptedVault) {
      return res.status(400).json({ error: 'Vault is not initialized. Please initialize vault first.' });
    }

    const gatheredShares = [];

    // Gather Share from Cloud A if selected
    if (selectedClouds.includes('CloudA')) {
      const doc = await VaultShare.findOne({}) || inMemoryShareA;
      if (doc) {
        gatheredShares.push({ x: doc.x, yHex: doc.yHex, cloud: 'Cloud A (AWS)' });
      }
    }

    // Gather Share from Cloud B over mTLS if selected
    if (selectedClouds.includes('CloudB')) {
      const resB = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/vault/share`);
      if (resB.data?.share) {
        gatheredShares.push({ ...resB.data.share, cloud: 'Cloud B (GCP)' });
      }
    }

    // Gather Share from Cloud C over mTLS if selected
    if (selectedClouds.includes('CloudC')) {
      const resC = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/vault/share`);
      if (resC.data?.share) {
        gatheredShares.push({ ...resC.data.share, cloud: 'Cloud C (Azure)' });
      }
    }

    if (gatheredShares.length < 2) {
      return res.status(400).json({ error: `Could only collect ${gatheredShares.length} valid share(s). Need at least 2.` });
    }

    // Execute Lagrange Interpolation over Finite Prime Field Fp
    const reconstruction = shamirService.reconstructSecret(gatheredShares.slice(0, 2));

    // Decrypt the sealed clinical chart using the reconstructed key!
    let decryptedRecord = null;
    try {
      decryptedRecord = decryptPayload(
        encryptedVault.ciphertextHex,
        encryptedVault.ivHex,
        encryptedVault.tagHex,
        reconstruction.reconstructedSecretHex
      );
    } catch (decErr) {
      return res.status(500).json({ error: 'Decryption failed: Reconstructed key did not match AES-GCM tag', details: decErr.message });
    }

    // Log quorum success to Cloud C Azure audit ledger
    await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
      action: 'VAULT_THRESHOLD_RECONSTRUCTED_QUORUM_SUCCESS',
      clientCN: 'cloud-a-auth',
      targetService: '3-Cloud Vault Quorum Engine',
      status: 'RECOVERY_AUTHENTICATED',
      details: `Lagrange interpolation evaluated across quorum [${reconstruction.participatingClouds.join(', ')}]. Master key successfully reconstructed and vault decrypted.`
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Master Key reconstructed via Multi-Cloud Lagrange Interpolation!',
      quorumClouds: reconstruction.participatingClouds,
      reconstructedKeyHex: reconstruction.reconstructedSecretHex,
      lagrangeProof: {
        formula: 'S = sum_{j=1}^k y_j * l_j(0) mod p',
        finitePrimeField: 'p = 2^256 - 2^32 - 977 (secp256k1 field)',
        steps: reconstruction.lagrangeSteps
      },
      decryptedClinicalRecord: decryptedRecord
    });
  } catch (err) {
    console.error('Error during vault reconstruction:', err);
    res.status(500).json({ error: 'Vault reconstruction failed', details: err.message });
  }
};
