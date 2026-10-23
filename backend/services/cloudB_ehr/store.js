// Pre-seeded rich clinical store for Cloud B (GCP Patient & EHR Microservice)

const doctors = [
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

const patients = [
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

const vitals = [
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

const prescriptions = [
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

module.exports = {
  doctors,
  patients,
  vitals,
  prescriptions,

  // Patient methods
  getPatient(id) {
    return patients.find((p) => p.id === id || p.email === id);
  },

  addPatient(patientData) {
    const id = `pat-${patients.length + 1}`;
    const newPatient = {
      id,
      ...patientData,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    patients.push(newPatient);

    if (patientData.primaryDoctorId) {
      const doc = doctors.find((d) => d.id === patientData.primaryDoctorId);
      if (doc && !doc.assignedPatients.includes(id)) {
        doc.assignedPatients.push(id);
      }
    }
    return newPatient;
  },

  // Doctor methods
  getDoctor(id) {
    return doctors.find((d) => d.id === id || d.email === id);
  },

  addDoctor(doctorData) {
    const id = `doc-${doctors.length + 1}`;
    const newDoctor = {
      id,
      ...doctorData,
      assignedPatients: []
    };
    doctors.push(newDoctor);
    return newDoctor;
  },

  getDoctorPatients(doctorId) {
    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return [];
    return patients.filter((p) => doc.assignedPatients.includes(p.id) || p.primaryDoctorId === doctorId);
  },

  // Vitals methods
  getPatientVitals(patientId) {
    return vitals
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  },

  addVitals(vitalsData) {
    const id = `vit-${vitals.length + 1}`;
    const newEntry = {
      id,
      ...vitalsData,
      recordedAt: vitalsData.recordedAt || new Date().toISOString()
    };
    vitals.push(newEntry);
    return newEntry;
  },

  // Prescriptions methods
  getPatientPrescriptions(patientId) {
    return prescriptions
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.prescribedAt) - new Date(a.prescribedAt));
  },

  addPrescription(rxData) {
    const id = `rx-${prescriptions.length + 1}`;
    const newRx = {
      id,
      ...rxData,
      status: rxData.status || 'ACTIVE',
      prescribedAt: rxData.prescribedAt || new Date().toISOString().split('T')[0]
    };
    prescriptions.push(newRx);
    return newRx;
  },

  updatePrescriptionStatus(id, status) {
    const rx = prescriptions.find((r) => r.id === id);
    if (rx) {
      rx.status = status;
    }
    return rx;
  }
};
