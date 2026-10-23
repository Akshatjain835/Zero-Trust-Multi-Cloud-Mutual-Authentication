const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken, requireRole('DOCTOR', 'ADMIN'));

// Existing endpoints
router.get('/patients', doctorController.getAssignedPatients);
router.get('/appointments', doctorController.getAppointments);
router.put('/appointments/:id/complete', doctorController.completeAppointment);

// Clinical Tier 2 endpoints: Vitals & Prescriptions
router.get('/patients/:patientId/vitals', doctorController.getPatientVitals);
router.post('/patients/:patientId/vitals', doctorController.recordPatientVitals);
router.get('/patients/:patientId/prescriptions', doctorController.getPatientPrescriptions);
router.post('/patients/:patientId/prescriptions', doctorController.issuePrescription);

module.exports = router;
