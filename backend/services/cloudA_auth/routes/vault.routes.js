const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Vault management routes
router.post('/initialize', vaultController.initializeVault);
router.get('/status', vaultController.getVaultStatus);
router.post('/simulate-breach', vaultController.simulateBreach);
router.post('/reconstruct', vaultController.reconstructVault);

module.exports = router;
