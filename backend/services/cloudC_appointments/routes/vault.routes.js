const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');

router.post('/share', vaultController.storeShare);
router.get('/share', vaultController.getShare);

module.exports = router;
