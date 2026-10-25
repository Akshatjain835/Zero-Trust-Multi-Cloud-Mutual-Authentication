const User = require('../models/User');

const seedUsers = [
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

// In-memory cache for fallback resilience
let inMemoryUsers = [...seedUsers];
let isSeeded = false;

async function initDB() {
  if (isSeeded) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding Cloud A MongoDB (meditrust_auth) with initial users...');
      await User.insertMany(seedUsers);
      console.log('✅ Initial users seeded successfully into MongoDB.');
    }
    isSeeded = true;
  } catch (err) {
    console.warn('⚠️ MongoDB auto-seed deferred (using in-memory cache until DB connects):', err.message);
  }
}

// Trigger initial seed check
initDB();

module.exports = {
  seedUsers,

  get users() {
    return inMemoryUsers;
  },

  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      const doc = await User.findOne({ email: cleanEmail }).lean();
      if (doc) return doc;
    } catch (err) {
      console.warn('MongoDB query failed, falling back to cache:', err.message);
    }
    return inMemoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  },

  async findById(id) {
    if (!id) return null;
    try {
      const doc = await User.findOne({ id }).lean();
      if (doc) return doc;
    } catch (err) {
      console.warn('MongoDB query failed, falling back to cache:', err.message);
    }
    return inMemoryUsers.find((u) => u.id === id);
  },

  async addUser(userData) {
    const count = await this.countUsers();
    const newUser = {
      id: userData.id || `usr-${count + 1}`,
      ...userData
    };

    inMemoryUsers.push(newUser);

    try {
      const created = await User.create(newUser);
      return created.toObject ? created.toObject() : created;
    } catch (err) {
      console.warn('MongoDB save failed, stored in memory cache:', err.message);
      return newUser;
    }
  },

  async countUsers() {
    try {
      const count = await User.countDocuments();
      if (count > 0) return count;
    } catch (err) {
      // fallback
    }
    return inMemoryUsers.length;
  },

  async getAllUsers() {
    try {
      const docs = await User.find({}).lean();
      if (docs && docs.length > 0) return docs;
    } catch (err) {
      // fallback
    }
    return inMemoryUsers;
  }
};
