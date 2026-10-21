// Pre-seeded store for Cloud B (GCP Patient & EHR Microservice)

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

module.exports = {
  doctors,
  patients,

  addPatient(patientData) {
    const id = `pat-${patients.length + 1}`;
    const newPatient = {
      id,
      ...patientData,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    patients.push(newPatient);

    // Assign to doctor if primaryDoctorId provided
    if (patientData.primaryDoctorId) {
      const doc = doctors.find((d) => d.id === patientData.primaryDoctorId);
      if (doc && !doc.assignedPatients.includes(id)) {
        doc.assignedPatients.push(id);
      }
    }
    return newPatient;
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
  }
};
