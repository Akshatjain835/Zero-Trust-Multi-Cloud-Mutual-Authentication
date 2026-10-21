// Pre-seeded store for Cloud C (Azure Appointments & Security Audit Microservice)

const appointments = [
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

const auditLogs = [
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

module.exports = {
  appointments,
  auditLogs,

  addAppointment(aptData) {
    const id = `apt-${appointments.length + 101}`;
    const newApt = {
      id,
      ...aptData,
      status: aptData.status || 'PENDING',
      mTLSHandshakeId: `mtls-tx-${Math.floor(10000 + Math.random() * 90000)}`
    };
    appointments.push(newApt);
    this.addAuditLog({
      clientCN: aptData.clientCN || 'cloud-a-auth',
      action: 'BOOK_APPOINTMENT_MTLS',
      targetService: 'Cloud C - Azure Appointments',
      status: 'SUCCESS 201',
      details: `Created appointment ${id} for patient ${aptData.patientId}`
    });
    return newApt;
  },

  completeAppointment(aptId) {
    const apt = appointments.find((a) => a.id === aptId);
    if (apt) {
      apt.status = 'COMPLETED';
      this.addAuditLog({
        clientCN: 'cloud-a-auth',
        action: 'MARK_APPOINTMENT_COMPLETED',
        targetService: 'Cloud C - Azure Appointments',
        status: 'SUCCESS 200',
        details: `Doctor updated appointment ${aptId} status to COMPLETED`
      });
    }
    return apt;
  },

  addAuditLog(logData) {
    const newLog = {
      id: `log-${auditLogs.length + 1}`,
      timestamp: new Date().toISOString(),
      clientCN: logData.clientCN || 'cloud-a-auth',
      issuer: 'ZeroTrust-RootCA',
      action: logData.action || 'INTER_CLOUD_MTLS_REQUEST',
      targetService: logData.targetService || 'Cloud C - Azure',
      status: logData.status || 'SUCCESS 200',
      details: logData.details || 'Zero-Trust mTLS call verified successfully'
    };
    auditLogs.unshift(newLog); // Put newest log at the top
    return newLog;
  }
};
