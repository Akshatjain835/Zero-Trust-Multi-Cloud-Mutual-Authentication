// In-Memory User Credentials & Profiles for Cloud A (AWS Auth & Identity Gateway)

const users = [
  {
    id: 'admin-1',
    email: 'admin@health.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'ADMIN'
  },
  {
    id: 'doc-1',
    email: 'sarah.jenkins@health.com',
    password: 'doctor123',
    name: 'Dr. Sarah Jenkins',
    role: 'DOCTOR',
    doctorId: 'doc-1'
  },
  {
    id: 'doc-2',
    email: 'marcus.vance@health.com',
    password: 'doctor123',
    name: 'Dr. Marcus Vance',
    role: 'DOCTOR',
    doctorId: 'doc-2'
  },
  {
    id: 'pat-1',
    email: 'john.doe@patient.com',
    password: 'patient123',
    name: 'John Doe',
    role: 'PATIENT',
    patientId: 'pat-1'
  },
  {
    id: 'pat-2',
    email: 'emily.watson@patient.com',
    password: 'patient123',
    name: 'Emily Watson',
    role: 'PATIENT',
    patientId: 'pat-2'
  },
  {
    id: 'pat-3',
    email: 'robert.chen@patient.com',
    password: 'patient123',
    name: 'Robert Chen',
    role: 'PATIENT',
    patientId: 'pat-3'
  }
];

module.exports = {
  users,

  findByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id) {
    return users.find((u) => u.id === id);
  },

  addUser(userData) {
    const newUser = {
      id: userData.id || `usr-${users.length + 1}`,
      ...userData
    };
    users.push(newUser);
    return newUser;
  }
};
