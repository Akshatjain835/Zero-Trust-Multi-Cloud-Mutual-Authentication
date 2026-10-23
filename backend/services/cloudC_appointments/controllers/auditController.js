const store = require('../store');

exports.getAuditLogs = (req, res) => {
  res.json({
    auditLogs: store.auditLogs,
    totalLogs: store.auditLogs.length,
    mtlsVerified: req.mtls?.isAuthorized || false,
    service: 'Cloud C - Azure Security Audit Service'
  });
};

exports.createAuditLog = (req, res) => {
  const { action, targetService, status, details, clientCN } = req.body;
  const log = store.addAuditLog({
    action,
    targetService,
    status,
    details,
    clientCN: clientCN || req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth'
  });
  res.status(201).json({ message: 'Security audit entry committed', log });
};
