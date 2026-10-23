const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/health', systemController.getSystemHealth);
router.post('/simulate-attack', systemController.simulateAttack);

module.exports = router;
