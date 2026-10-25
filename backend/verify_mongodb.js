const path = require('path');
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = require(path.join(__dirname, 'services', 'cloudA_auth', 'node_modules', 'mongoose'));
}

// Service 1: Cloud A
const cloudAUserStore = require('c:/coding/healthcare_system_2/backend/services/cloudA_auth/store/userStore');
const cloudAConnectDB = require('c:/coding/healthcare_system_2/backend/services/cloudA_auth/config/db');

// Service 2: Cloud B
const cloudBStore = require('c:/coding/healthcare_system_2/backend/services/cloudB_ehr/store');
const cloudBDB = require('c:/coding/healthcare_system_2/backend/services/cloudB_ehr/config/db');

// Service 3: Cloud C
const cloudCStore = require('c:/coding/healthcare_system_2/backend/services/cloudC_appointments/store');
const cloudCDB = require('c:/coding/healthcare_system_2/backend/services/cloudC_appointments/config/db');

async function testAll() {
  console.log('--- TESTING CLOUD A MONGODB ---');
  await cloudAConnectDB();
  const users = await cloudAUserStore.getAllUsers();
  console.log(`Cloud A Users in DB: ${users.length}`);
  const admin = await cloudAUserStore.findByEmail('admin@health.com');
  console.log(`Found admin: ${admin ? admin.name : 'NO'}`);

  console.log('\n--- TESTING CLOUD B MONGODB ---');
  await cloudBDB.connectDB();
  const patients = await cloudBStore.getPatients();
  console.log(`Cloud B Patients in DB: ${patients.length}`);
  const doctors = await cloudBStore.getDoctors();
  console.log(`Cloud B Doctors in DB: ${doctors.length}`);
  const vitals = await cloudBStore.getPatientVitals('pat-1');
  console.log(`Cloud B Vitals for pat-1: ${vitals.length}`);

  console.log('\n--- TESTING CLOUD C MONGODB ---');
  await cloudCDB.connectDB();
  const apts = await cloudCStore.getAppointments();
  console.log(`Cloud C Appointments in DB: ${apts.length}`);
  const logs = await cloudCStore.getAuditLogs();
  console.log(`Cloud C Audit Logs in DB: ${logs.length}`);

  console.log('\n✅ ALL 3 CLOUD MICROSERVICES ARE CONNECTED TO MONGODB SUCCESSFULLY!');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
