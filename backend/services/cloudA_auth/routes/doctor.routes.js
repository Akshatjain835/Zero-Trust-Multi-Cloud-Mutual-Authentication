const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken, requireRole('DOCTOR', 'ADMIN'));

// Patient Registry (Assigned Patients & Hospital ER / Emergency Registry)
router.get('/patients', doctorController.getAssignedPatients);
router.get('/patients/registry', doctorController.getHospitalRegistry);
router.get('/patients/:patientId/clinical-summary', doctorController.getPatientClinicalSummary);

// Emergency Break-Glass Access Protocol endpoints
router.post('/break-glass', doctorController.initiateBreakGlass);
router.post('/break-glass/conclude', doctorController.concludeBreakGlass);
router.get('/break-glass/active', doctorController.getActiveBreakGlass);

// Appointments
router.get('/appointments', doctorController.getAppointments);
router.put('/appointments/:id/complete', doctorController.completeAppointment);

// Clinical Tier 2 endpoints: Vitals & Prescriptions (Protected by Zero-Trust ABAC)
router.get('/patients/:patientId/vitals', doctorController.getPatientVitals);
router.post('/patients/:patientId/vitals', doctorController.recordPatientVitals);
router.get('/patients/:patientId/prescriptions', doctorController.getPatientPrescriptions);
router.post('/patients/:patientId/prescriptions', doctorController.issuePrescription);

module.exports = router;
