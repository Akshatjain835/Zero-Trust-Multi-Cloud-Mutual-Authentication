const express = require('express');
const router = express.Router();
const ehrController = require('../controllers/ehrController');

// Vitals routes
router.get('/patients/:patientId/vitals', ehrController.getPatientVitals);
router.post('/patients/:patientId/vitals', ehrController.addPatientVitals);

// Prescriptions routes
router.get('/patients/:patientId/prescriptions', ehrController.getPatientPrescriptions);
router.post('/patients/:patientId/prescriptions', ehrController.addPrescription);
router.put('/prescriptions/:rxId/status', ehrController.updatePrescriptionStatus);

module.exports = router;
