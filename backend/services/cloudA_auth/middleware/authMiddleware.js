const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token. Authorization header with Bearer token is required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid signature' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied: Role '${req.user?.role || 'ANONYMOUS'}' is not authorized for this resource. Required: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole
};
