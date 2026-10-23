const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken, requireRole('ADMIN'));

router.post('/register-patient', adminController.registerPatient);
router.post('/register-doctor', adminController.registerDoctor);
router.get('/metrics', adminController.getSystemMetrics);

module.exports = router;
