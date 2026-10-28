const VaultShare = require('../models/VaultShare');

let inMemoryShare = null;

exports.storeShare = async (req, res) => {
  const { x, yHex, cloud, role } = req.body;
  if (!x || !yHex) {
    return res.status(400).json({ error: 'x and yHex are required' });
  }

  inMemoryShare = { x, yHex, cloud: cloud || 'Cloud B (GCP)', role: role || 'Clinical EHR' };

  try {
    await VaultShare.deleteMany({}); // Keep only active share
    await VaultShare.create({
      x,
      yHex,
      cloud: inMemoryShare.cloud,
      role: inMemoryShare.role
    });
  } catch (err) {
    console.warn('MongoDB VaultShare save warning (using memory):', err.message);
  }

  res.status(201).json({
    message: 'Vault share deposited successfully into Cloud B (GCP)',
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
  } catch (err) {
    // Fallback
  }

  if (inMemoryShare) {
    return res.json({
      share: inMemoryShare,
      mtlsVerified: req.mtls?.isAuthorized || false
    });
  }

  res.status(404).json({ error: 'No vault share is deposited in Cloud B' });
};
