const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/patients', doctorController.getDoctorPatients);
router.post('/', doctorController.registerDoctor);

module.exports = router;
