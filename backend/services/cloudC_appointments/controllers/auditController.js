const store = require('../store');

exports.getAuditLogs = async (req, res) => {
  const auditLogs = await store.getAuditLogs();
  res.json({
    auditLogs,
    totalLogs: auditLogs.length,
    mtlsVerified: req.mtls?.isAuthorized || false,
    service: 'Cloud C - Azure Security Audit Service'
  });
};

exports.createAuditLog = async (req, res) => {
  const { action, targetService, status, details, clientCN } = req.body;
  const log = await store.addAuditLog({
    action,
    targetService,
    status,
    details,
    clientCN: clientCN || req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth'
  });
  res.status(201).json({ message: 'Security audit entry committed', log });
};

