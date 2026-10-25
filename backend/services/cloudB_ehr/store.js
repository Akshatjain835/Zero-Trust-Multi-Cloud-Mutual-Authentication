const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Vital = require('./models/Vital');
const Prescription = require('./models/Prescription');

// Pre-seeded rich clinical dataset for Cloud B (GCP Patient & EHR Microservice)
const seedDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@health.com',
    specialty: 'Cardiology',
    department: 'Cardiovascular Care',
    assignedPatients: ['pat-1', 'pat-2']
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@health.com',
    specialty: 'Neurology',
    department: 'Brain & Spine Institute',
    assignedPatients: ['pat-3']
  }
];

const seedPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    email: 'john.doe@patient.com',
    age: 42,
    gender: 'Male',
    bloodGroup: 'O+',
    primaryDoctorId: 'doc-1',
    diagnosis: 'Hypertension & Mild Arrhythmia',
    registeredAt: '2026-01-15'
  },
  {
    id: 'pat-2',
    name: 'Emily Watson',
    email: 'emily.watson@patient.com',
    age: 35,
    gender: 'Female',
    bloodGroup: 'A+',
    primaryDoctorId: 'doc-1',
    diagnosis: 'Routine Cardiovascular Checkup',
    registeredAt: '2026-03-10'
  },
  {
    id: 'pat-3',
    name: 'Robert Chen',
    email: 'robert.chen@patient.com',
    age: 58,
    gender: 'Male',
    bloodGroup: 'B-',
    primaryDoctorId: 'doc-2',
    diagnosis: 'Chronic Migraine & Cervical Spondylosis',
    registeredAt: '2026-04-22'
  }
];

const seedVitals = [
  {
    id: 'vit-1',
    patientId: 'pat-1',
    heartRate: 74,
    bloodPressure: '122/82',
    spO2: 98,
    temperature: 98.6,
    recordedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    recordedAt: '2026-10-20T10:15:00Z',
    status: 'NORMAL',
    notes: 'Blood pressure well managed on medication.'
  },
  {
    id: 'vit-2',
    patientId: 'pat-1',
    heartRate: 88,
    bloodPressure: '138/88',
    spO2: 97,
    temperature: 99.1,
    recordedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    recordedAt: '2026-10-22T08:30:00Z',
    status: 'ELEVATED',
    notes: 'Slightly elevated post-exertion, recheck next visit.'
  },
  {
    id: 'vit-3',
    patientId: 'pat-2',
    heartRate: 68,
    bloodPressure: '116/76',
    spO2: 99,
    temperature: 98.4,
    recordedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    recordedAt: '2026-10-18T14:20:00Z',
    status: 'OPTIMAL',
    notes: 'All cardiac parameters within normal range.'
  },
  {
    id: 'vit-4',
    patientId: 'pat-3',
    heartRate: 82,
    bloodPressure: '130/84',
    spO2: 98,
    temperature: 98.7,
    recordedBy: 'Dr. Marcus Vance',
    doctorId: 'doc-2',
    recordedAt: '2026-10-19T11:00:00Z',
    status: 'NORMAL',
    notes: 'Neurological baseline stable.'
  }
];

const seedPrescriptions = [
  {
    id: 'rx-1',
    patientId: 'pat-1',
    medication: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily (morning)',
    duration: '90 days',
    instructions: 'Take with food and full glass of water.',
    prescribedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    prescribedAt: '2026-09-01',
    status: 'ACTIVE'
  },
  {
    id: 'rx-2',
    patientId: 'pat-1',
    medication: 'Amlodipine Besylate',
    dosage: '5mg',
    frequency: 'Once daily (evening)',
    duration: '60 days',
    instructions: 'Monitor BP weekly.',
    prescribedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    prescribedAt: '2026-10-10',
    status: 'ACTIVE'
  },
  {
    id: 'rx-3',
    patientId: 'pat-2',
    medication: 'Omega-3 Fish Oil Concentrate',
    dosage: '1000mg',
    frequency: 'Twice daily',
    duration: '180 days',
    instructions: 'Cardiovascular preventive supplement.',
    prescribedBy: 'Dr. Sarah Jenkins',
    doctorId: 'doc-1',
    prescribedAt: '2026-03-10',
    status: 'ACTIVE'
  },
  {
    id: 'rx-4',
    patientId: 'pat-3',
    medication: 'Sumatriptan Succinate',
    dosage: '50mg',
    frequency: 'As needed for acute migraine',
    duration: '30 days',
    instructions: 'Max 2 tablets in 24 hours.',
    prescribedBy: 'Dr. Marcus Vance',
    doctorId: 'doc-2',
    prescribedAt: '2026-08-15',
    status: 'ACTIVE'
  }
];

// In-memory fallback caches
let inMemoryDoctors = [...seedDoctors];
let inMemoryPatients = [...seedPatients];
let inMemoryVitals = [...seedVitals];
let inMemoryPrescriptions = [...seedPrescriptions];

let isSeeded = false;
async function initCloudBDB() {
  if (isSeeded) return;
  try {
    const docCount = await Doctor.countDocuments();
    if (docCount === 0) {
      console.log('🌱 Seeding Cloud B MongoDB (meditrust_ehr) with initial clinical records...');
      await Promise.all([
        Doctor.insertMany(seedDoctors),
        Patient.insertMany(seedPatients),
        Vital.insertMany(seedVitals),
        Prescription.insertMany(seedPrescriptions)
      ]);
      console.log('✅ Cloud B Clinical EHR records seeded successfully into MongoDB.');
    }
    isSeeded = true;
  } catch (err) {
    console.warn('⚠️ Cloud B auto-seed deferred (using in-memory cache until DB connects):', err.message);
  }
}

// Initial seed trigger
initCloudBDB();

module.exports = {
  get doctors() { return inMemoryDoctors; },
  get patients() { return inMemoryPatients; },
  get vitals() { return inMemoryVitals; },
  get prescriptions() { return inMemoryPrescriptions; },

  // Patient methods
  async getPatients() {
    try {
      const docs = await Patient.find({}).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryPatients;
  },

  async getPatient(id) {
    try {
      const doc = await Patient.findOne({ $or: [{ id }, { email: id }] }).lean();
      if (doc) return doc;
    } catch (e) { /* fallback */ }
    return inMemoryPatients.find((p) => p.id === id || p.email === id);
  },

  async addPatient(patientData) {
    const total = inMemoryPatients.length;
    const id = `pat-${total + 1}`;
    const newPatient = {
      id,
      ...patientData,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    inMemoryPatients.push(newPatient);

    try {
      await Patient.create(newPatient);
      if (patientData.primaryDoctorId) {
        await Doctor.updateOne(
          { id: patientData.primaryDoctorId },
          { $addToSet: { assignedPatients: id } }
        );
      }
    } catch (err) {
      console.warn('MongoDB save patient failed, cached in memory:', err.message);
    }

    if (patientData.primaryDoctorId) {
      const doc = inMemoryDoctors.find((d) => d.id === patientData.primaryDoctorId);
      if (doc && !doc.assignedPatients.includes(id)) {
        doc.assignedPatients.push(id);
      }
    }
    return newPatient;
  },

  // Doctor methods
  async getDoctors() {
    try {
      const docs = await Doctor.find({}).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryDoctors;
  },

  async getDoctor(id) {
    try {
      const doc = await Doctor.findOne({ $or: [{ id }, { email: id }] }).lean();
      if (doc) return doc;
    } catch (e) { /* fallback */ }
    return inMemoryDoctors.find((d) => d.id === id || d.email === id);
  },

  async addDoctor(doctorData) {
    const id = `doc-${inMemoryDoctors.length + 1}`;
    const newDoctor = {
      id,
      ...doctorData,
      assignedPatients: []
    };
    inMemoryDoctors.push(newDoctor);

    try {
      await Doctor.create(newDoctor);
    } catch (err) {
      console.warn('MongoDB save doctor failed, cached in memory:', err.message);
    }
    return newDoctor;
  },

  async getDoctorPatients(doctorId) {
    try {
      const doc = await Doctor.findOne({ id: doctorId }).lean();
      if (doc) {
        const assigned = doc.assignedPatients || [];
        const patients = await Patient.find({
          $or: [{ id: { $in: assigned } }, { primaryDoctorId: doctorId }]
        }).lean();
        if (patients) return patients;
      }
    } catch (e) { /* fallback */ }

    const doc = inMemoryDoctors.find((d) => d.id === doctorId);
    if (!doc) return [];
    return inMemoryPatients.filter((p) => doc.assignedPatients.includes(p.id) || p.primaryDoctorId === doctorId);
  },

  // Vitals methods
  async getPatientVitals(patientId) {
    try {
      const list = await Vital.find({ patientId }).sort({ recordedAt: -1 }).lean();
      if (list && list.length > 0) return list;
    } catch (e) { /* fallback */ }

    return inMemoryVitals
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  },

  async addVitals(vitalsData) {
    const id = `vit-${inMemoryVitals.length + 1}`;
    const newEntry = {
      id,
      ...vitalsData,
      recordedAt: vitalsData.recordedAt || new Date().toISOString()
    };
    inMemoryVitals.push(newEntry);

    try {
      await Vital.create(newEntry);
    } catch (err) {
      console.warn('MongoDB save vitals failed, cached in memory:', err.message);
    }
    return newEntry;
  },

  // Prescriptions methods
  async getPatientPrescriptions(patientId) {
    try {
      const list = await Prescription.find({ patientId }).sort({ prescribedAt: -1 }).lean();
      if (list && list.length > 0) return list;
    } catch (e) { /* fallback */ }

    return inMemoryPrescriptions
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.prescribedAt) - new Date(a.prescribedAt));
  },

  async addPrescription(rxData) {
    const id = `rx-${inMemoryPrescriptions.length + 1}`;
    const newRx = {
      id,
      ...rxData,
      status: rxData.status || 'ACTIVE',
      prescribedAt: rxData.prescribedAt || new Date().toISOString().split('T')[0]
    };
    inMemoryPrescriptions.push(newRx);

    try {
      await Prescription.create(newRx);
    } catch (err) {
      console.warn('MongoDB save prescription failed, cached in memory:', err.message);
    }
    return newRx;
  },

  async updatePrescriptionStatus(id, status) {
    try {
      await Prescription.updateOne({ id }, { status });
    } catch (err) {
      console.warn('MongoDB update prescription failed:', err.message);
    }

    const rx = inMemoryPrescriptions.find((r) => r.id === id);
    if (rx) {
      rx.status = status;
    }
    return rx;
  }
};
