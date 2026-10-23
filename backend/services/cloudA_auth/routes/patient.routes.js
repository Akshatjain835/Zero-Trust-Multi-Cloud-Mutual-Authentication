const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken, requireRole('PATIENT', 'ADMIN'));

router.get('/history', patientController.getMedicalHistory);
router.post('/appointments', patientController.bookAppointment);
router.get('/doctors', patientController.getAvailableDoctors);

module.exports = router;
