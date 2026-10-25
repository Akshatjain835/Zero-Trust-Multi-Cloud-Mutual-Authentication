const Appointment = require('./models/Appointment');
const AuditLog = require('./models/AuditLog');

// Pre-seeded store for Cloud C (Azure Appointments & Security Audit Microservice)
const seedAppointments = [
  {
    id: 'apt-101',
    patientId: 'pat-1',
    patientName: 'John Doe',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    date: '2026-09-14',
    time: '10:30 AM',
    status: 'PENDING',
    notes: 'Follow-up ECG consultation and blood pressure evaluation.',
    mTLSHandshakeId: 'mtls-tx-88312'
  },
  {
    id: 'apt-102',
    patientId: 'pat-2',
    patientName: 'Emily Watson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    date: '2026-08-02',
    time: '02:15 PM',
    status: 'COMPLETED',
    notes: 'Prescribed preventative beta-blocker dosage. Vitals normal.',
    mTLSHandshakeId: 'mtls-tx-88344'
  },
  {
    id: 'apt-103',
    patientId: 'pat-3',
    patientName: 'Robert Chen',
    doctorId: 'doc-2',
    doctorName: 'Dr. Marcus Vance',
    department: 'Neurology',
    date: '2026-09-18',
    time: '11:00 AM',
    status: 'PENDING',
    notes: 'Follow-up MRI evaluation scheduled.',
    mTLSHandshakeId: 'mtls-tx-88390'
  }
];

const seedAuditLogs = [
  {
    id: 'log-1',
    timestamp: '2026-09-12T10:00:00.000Z',
    clientCN: 'cloud-a-auth',
    issuer: 'ZeroTrust-RootCA',
    action: 'MUTUAL_TLS_HANDSHAKE_SUCCESS',
    targetService: 'Cloud C - Azure Appointments',
    status: 'SUCCESS 200',
    details: 'Validated X.509 Client Cert thumbprint SHA256'
  }
];

// In-memory fallback caches
let inMemoryAppointments = [...seedAppointments];
let inMemoryAuditLogs = [...seedAuditLogs];

let isSeeded = false;
async function initCloudCDB() {
  if (isSeeded) return;
  try {
    const aptCount = await Appointment.countDocuments();
    if (aptCount === 0) {
      console.log('🌱 Seeding Cloud C MongoDB (meditrust_appointments) with initial records...');
      await Promise.all([
        Appointment.insertMany(seedAppointments),
        AuditLog.insertMany(seedAuditLogs)
      ]);
      console.log('✅ Cloud C Appointments & Audit records seeded successfully into MongoDB.');
    }
    isSeeded = true;
  } catch (err) {
    console.warn('⚠️ Cloud C auto-seed deferred (using in-memory cache until DB connects):', err.message);
  }
}

// Initial seed trigger
initCloudCDB();

module.exports = {
  get appointments() { return inMemoryAppointments; },
  get auditLogs() { return inMemoryAuditLogs; },

  async getAppointments() {
    try {
      const docs = await Appointment.find({}).sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryAppointments;
  },

  async getAppointment(id) {
    try {
      const doc = await Appointment.findOne({ id }).lean();
      if (doc) return doc;
    } catch (e) { /* fallback */ }
    return inMemoryAppointments.find((a) => a.id === id);
  },

  async getPatientAppointments(patientId) {
    try {
      const docs = await Appointment.find({ patientId }).sort({ date: -1 }).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryAppointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getDoctorAppointments(doctorId) {
    try {
      const docs = await Appointment.find({ doctorId }).sort({ date: -1 }).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryAppointments
      .filter((a) => a.doctorId === doctorId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async addAppointment(aptData) {
    const id = `apt-${inMemoryAppointments.length + 101}`;
    const newApt = {
      id,
      ...aptData,
      status: aptData.status || 'SCHEDULED',
      mTLSHandshakeId: `mtls-tx-${Math.floor(10000 + Math.random() * 90000)}`
    };
    inMemoryAppointments.push(newApt);

    try {
      await Appointment.create(newApt);
    } catch (err) {
      console.warn('MongoDB save appointment failed, cached in memory:', err.message);
    }

    this.addAuditLog({
      clientCN: aptData.clientCN || 'cloud-a-auth',
      action: 'BOOK_APPOINTMENT_MTLS',
      targetService: 'Cloud C - Azure Appointments',
      status: 'SUCCESS 201',
      details: `Created appointment ${id} for patient ${aptData.patientId}`
    });

    return newApt;
  },

  async completeAppointment(aptId) {
    try {
      await Appointment.updateOne({ id: aptId }, { status: 'COMPLETED' });
    } catch (err) {
      console.warn('MongoDB complete appointment failed:', err.message);
    }

    const apt = inMemoryAppointments.find((a) => a.id === aptId);
    if (apt) {
      apt.status = 'COMPLETED';
    }

    this.addAuditLog({
      clientCN: 'cloud-a-auth',
      action: 'MARK_APPOINTMENT_COMPLETED',
      targetService: 'Cloud C - Azure Appointments',
      status: 'SUCCESS 200',
      details: `Doctor updated appointment ${aptId} status to COMPLETED`
    });

    return apt;
  },

  async cancelAppointment(aptId, reason, clientCN) {
    try {
      await Appointment.updateOne({ id: aptId }, { 
        status: 'CANCELLED',
        cancellationReason: reason || 'Cancelled by patient or physician'
      });
    } catch (err) {
      console.warn('MongoDB cancel appointment failed:', err.message);
    }

    const apt = inMemoryAppointments.find((a) => a.id === aptId);
    if (apt) {
      apt.status = 'CANCELLED';
      apt.cancellationReason = reason || 'Cancelled by patient or physician';
    }

    this.addAuditLog({
      clientCN: clientCN || 'cloud-a-auth',
      action: 'CANCEL_APPOINTMENT',
      targetService: 'Cloud C - Azure Appointments',
      status: 'SUCCESS 200',
      details: `Appointment ${aptId} cancelled. Reason: ${reason || 'N/A'}`
    });

    return apt;
  },

  // Security Audit Ledger methods
  async getAuditLogs() {
    try {
      const docs = await AuditLog.find({}).sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) return docs;
    } catch (e) { /* fallback */ }
    return inMemoryAuditLogs;
  },

  async addAuditLog(logData) {
    const newLog = {
      id: `log-${inMemoryAuditLogs.length + 1}`,
      timestamp: new Date().toISOString(),
      clientCN: logData.clientCN || 'cloud-a-auth',
      issuer: 'ZeroTrust-RootCA',
      action: logData.action || 'INTER_CLOUD_MTLS_REQUEST',
      targetService: logData.targetService || 'Cloud C - Azure',
      status: logData.status || 'SUCCESS 200',
      details: logData.details || 'Zero-Trust mTLS call verified successfully'
    };
    inMemoryAuditLogs.unshift(newLog); // Put newest log at the top

    try {
      await AuditLog.create(newLog);
    } catch (err) {
      // Handled in memory
    }

    return newLog;
  }
};
