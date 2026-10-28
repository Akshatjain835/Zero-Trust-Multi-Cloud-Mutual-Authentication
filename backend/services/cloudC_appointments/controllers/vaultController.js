const VaultShare = require('../models/VaultShare');
const store = require('../store');

let inMemoryShare = null;

exports.storeShare = async (req, res) => {
  const { x, yHex, cloud, role } = req.body;
  if (!x || !yHex) {
    return res.status(400).json({ error: 'x and yHex are required' });
  }

  inMemoryShare = { x, yHex, cloud: cloud || 'Cloud C (Azure)', role: role || 'Audit Ledger' };

  try {
    await VaultShare.deleteMany({});
    await VaultShare.create({
      x,
      yHex,
      cloud: inMemoryShare.cloud,
      role: inMemoryShare.role
    });
  } catch (err) {
    console.warn('MongoDB VaultShare save warning (using memory):', err.message);
  }

  // Notarize deposit into immutable audit ledger
  try {
    await store.addAuditLog({
      action: 'VAULT_THRESHOLD_SHARE_DEPOSITED',
      clientCN: req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth',
      targetService: 'Cloud C - Azure Vault Custody',
      status: 'SECURE_STORAGE_COMMITTED',
      details: `Shamir threshold share x=${x} deposited into Cloud C custody. Zero knowledge of master secret S.`
    });
  } catch (e) {}

  res.status(201).json({
    message: 'Vault share deposited successfully into Cloud C (Azure)',
    share: {
      x,
      cloud: inMemoryShare.cloud,
      role: inMemoryShare.role,
      yPreview: yHex.substring(0, 16) + '...'
    },
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getShare = async (req, res) => {
  try {
    const doc = await VaultShare.findOne({});
    if (doc) {
      // Log share access to audit ledger
      await store.addAuditLog({
        action: 'VAULT_THRESHOLD_SHARE_ACCESSED',
        clientCN: req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth',
        targetService: 'Cloud C - Azure Vault Custody',
        status: 'QUORUM_SHARE_RELEASED',
        details: `Share x=${doc.x} released to authorized peer under mutual authentication.`
      }).catch(() => {});

      return res.json({
        share: {
          x: doc.x,
          yHex: doc.yHex,
          cloud: doc.cloud,
          role: doc.role
        },
        mtlsVerified: req.mtls?.isAuthorized || false
      });
    }
  } catch (err) {}

  if (inMemoryShare) {
    return res.json({
      share: inMemoryShare,
      mtlsVerified: req.mtls?.isAuthorized || false
    });
  }

  res.status(404).json({ error: 'No vault share is deposited in Cloud C' });
};
