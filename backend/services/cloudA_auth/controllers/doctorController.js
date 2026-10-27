const mtlsClient = require('../services/mtlsClient');

// In-memory registry of active Break-Glass ephemeral sessions
// Key: `${doctorId}:${patientId}` -> Session Object
const activeBreakGlassSessions = new Map();

// Helper to resolve doctor ID from token or query (if admin)
function resolveDoctorId(req) {
  if (req.user.role === 'DOCTOR') {
    return req.user.doctorId || 'doc-1';
  }
  return req.query.doctorId || req.user.doctorId || 'doc-1';
}

// Zero-Trust ABAC Verification Engine:
// Checks if the doctor is authorized for the given patient:
// 1. Primary attending physician match (Normal Care Team)
// 2. Or active, valid Emergency Break-Glass override (JIT Access)
async function verifyDoctorPatientAccess(doctorId, patientId, doctorName = 'Attending Physician') {
  let patient;
  try {
    const res = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/patients/${patientId}`);
    patient = res.data.patient;
  } catch (err) {
    return {
      authorized: false,
      status: 404,
      error: 'PATIENT_NOT_FOUND',
      message: `Patient ${patientId} was not found in Cloud B EHR registry.`
    };
  }

  if (!patient) {
    return {
      authorized: false,
      status: 404,
      error: 'PATIENT_NOT_FOUND',
      message: `Patient ${patientId} was not found in Cloud B EHR registry.`
    };
  }

  // ABAC Rule 1: Assigned Physician Match
  if (patient.primaryDoctorId === doctorId) {
    return {
      authorized: true,
      isBreakGlass: false,
      patient
    };
  }

  // ABAC Rule 2: Active Emergency Break-Glass Override
  const sessionKey = `${doctorId}:${patientId}`;
  const session = activeBreakGlassSessions.get(sessionKey);
  if (session) {
    const now = Date.now();
    if (now < session.expiresAt) {
      return {
        authorized: true,
        isBreakGlass: true,
        session,
        patient
      };
    } else {
      // Ephemeral TTL expired: auto-evict and log to Cloud C ledger
      activeBreakGlassSessions.delete(sessionKey);
      mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
        action: 'EMERGENCY_BREAK_GLASS_EXPIRED',
        clientCN: 'cloud-a-auth',
        targetService: 'Cloud C - Azure Security Audit Ledger',
        status: 'SECURITY_INFO',
        details: `⏰ Emergency Break-Glass session ${session.sessionRef} for Doctor ${doctorId} on Patient ${patientId} has expired (TTL 10m reached). Zero-Trust access revoked.`
      }).catch((e) => console.error('Cloud C audit error on expiry:', e.message));
    }
  }

  // ABAC Rule 3: Zero-Trust Strict Denial
  return {
    authorized: false,
    status: 403,
    error: 'ZERO_TRUST_ABAC_DENIED',
    message: `Zero-Trust Access Control Violation: Doctor ${doctorId} is not assigned to Patient ${patient.name} (${patientId}). Access strictly isolated by policy.`,
    patient: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      primaryDoctorId: patient.primaryDoctorId
    },
    canBreakGlass: true
  };
}

// Doctor gets assigned patients from Cloud B (GCP)
exports.getAssignedPatients = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/doctors/${doctorId}/patients`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching doctor patients over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patients from Cloud B via mTLS', details: err.message });
  }
};

// Doctor gets all hospital patients partitioned into Assigned vs Emergency/Unassigned
exports.getHospitalRegistry = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/patients`);
    const allPatients = response.data.patients || [];

    const assignedPatients = [];
    const emergencyPatients = [];

    const now = Date.now();
    allPatients.forEach((p) => {
      const sessionKey = `${doctorId}:${p.id}`;
      const bgSession = activeBreakGlassSessions.get(sessionKey);
      const isBreakGlassActive = bgSession && now < bgSession.expiresAt;

      if (p.primaryDoctorId === doctorId) {
        assignedPatients.push({ ...p, isAssigned: true });
      } else {
        emergencyPatients.push({
          ...p,
          isAssigned: false,
          isBreakGlassActive: !!isBreakGlassActive,
          breakGlassSession: isBreakGlassActive ? bgSession : null
        });
      }
    });

    res.json({
      doctorId,
      assignedPatients,
      emergencyPatients,
      totalHospitalPatients: allPatients.length,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error fetching hospital patient registry over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch hospital registry from Cloud B', details: err.message });
  }
};

// Initiate Emergency Break-Glass Access Protocol
exports.initiateBreakGlass = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const doctorName = req.user.name || 'Attending Physician';
    const { patientId, emergencyCode, justification } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required for Break-Glass invocation' });
    }

    if (!justification || justification.trim().length < 10) {
      return res.status(400).json({
        error: 'Clinical justification is required (minimum 10 characters detailing patient life-safety urgency)'
      });
    }

    // Verify patient existence in Cloud B over mTLS
    let patient;
    try {
      const pRes = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/patients/${patientId}`);
      patient = pRes.data.patient;
    } catch (e) {
      return res.status(404).json({ error: `Patient ${patientId} not found in Cloud B EHR` });
    }

    if (!patient) {
      return res.status(404).json({ error: `Patient ${patientId} not found in Cloud B EHR` });
    }

    // Create Ephemeral Break-Glass Session with 10-minute TTL
    const ttlMinutes = 10;
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    const sessionRef = `AZ-BG-${Math.floor(100000 + Math.random() * 900000)}`;

    const session = {
      sessionRef,
      doctorId,
      doctorName,
      doctorEmail: req.user.email,
      patientId: patient.id,
      patientName: patient.name,
      emergencyCode: emergencyCode || 'CODE_BLUE_CARDIAC_ARREST',
      justification: justification.trim(),
      startedAt: new Date().toISOString(),
      expiresAt,
      ttlMinutes,
      status: 'ACTIVE'
    };

    const sessionKey = `${doctorId}:${patientId}`;
    activeBreakGlassSessions.set(sessionKey, session);

    // Commit high-severity tamper-evident audit record to Cloud C Azure Immutable Ledger over mTLS
    let auditLogResult = null;
    try {
      const auditRes = await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
        action: 'EMERGENCY_BREAK_GLASS_INITIATED',
        clientCN: 'cloud-a-auth',
        targetService: 'Cloud C - Azure Security Audit Ledger',
        status: 'SECURITY_ALERT',
        details: `🚨 EMERGENCY BREAK-GLASS OVERRIDE: ${doctorName} (${doctorId}) invoked emergency access to unassigned Patient ${patient.name} (${patient.id}). Incident Code: ${session.emergencyCode}. Reason: "${session.justification}". Audit Ref: ${sessionRef}. Ephemeral TTL: ${ttlMinutes}m.`
      });
      auditLogResult = auditRes.data.log;
    } catch (auditErr) {
      console.error('Failed to emit Break-Glass audit log to Cloud C:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `🚨 Emergency Break-Glass access granted for ${patient.name}. Ephemeral session valid for 10 minutes.`,
      session,
      auditLog: auditLogResult,
      patient
    });
  } catch (err) {
    console.error('Error initiating Break-Glass:', err.message);
    res.status(500).json({ error: 'Failed to initiate Emergency Break-Glass protocol', details: err.message });
  }
};

// Conclude Emergency Break-Glass Access Session Early
exports.concludeBreakGlass = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const doctorName = req.user.name || 'Attending Physician';
    const { patientId, reason } = req.body;

    const sessionKey = `${doctorId}:${patientId}`;
    const session = activeBreakGlassSessions.get(sessionKey);

    if (session) {
      activeBreakGlassSessions.delete(sessionKey);
    }

    // Commit concluding audit record to Cloud C
    try {
      await mtlsClient.axios.post(`${mtlsClient.cloudCUrl}/api/audit-logs`, {
        action: 'EMERGENCY_BREAK_GLASS_CONCLUDED',
        clientCN: 'cloud-a-auth',
        targetService: 'Cloud C - Azure Security Audit Ledger',
        status: 'SUCCESS 200',
        details: `🔒 Emergency Break-Glass session safely CONCLUDED by ${doctorName} (${doctorId}) for Patient ${patientId}. Access revoked. Reason: ${reason || 'Patient stabilized / Care transferred'}.`
      });
    } catch (auditErr) {
      console.error('Failed to emit Conclude Break-Glass audit to Cloud C:', auditErr.message);
    }

    res.json({
      success: true,
      message: `Emergency Break-Glass session safely concluded. Patient ${patientId} returned to strict Zero-Trust isolation.`
    });
  } catch (err) {
    console.error('Error concluding Break-Glass:', err.message);
    res.status(500).json({ error: 'Failed to conclude Break-Glass session', details: err.message });
  }
};

// Get Active Break-Glass Sessions for this Doctor
exports.getActiveBreakGlass = async (req, res) => {
  const doctorId = resolveDoctorId(req);
  const now = Date.now();
  const activeList = [];

  for (const [key, session] of activeBreakGlassSessions.entries()) {
    if (session.doctorId === doctorId && session.expiresAt > now) {
      activeList.push({
        ...session,
        remainingSeconds: Math.max(0, Math.floor((session.expiresAt - now) / 1000))
      });
    }
  }

  res.json({
    doctorId,
    activeSessions: activeList,
    count: activeList.length
  });
};

// Get Full Patient Clinical Summary (Protected by Zero-Trust ABAC & Break-Glass)
exports.getPatientClinicalSummary = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const { patientId } = req.params;

    const auth = await verifyDoctorPatientAccess(doctorId, patientId, req.user.name);
    if (!auth.authorized) {
      return res.status(auth.status).json(auth);
    }

    // Fetch vitals and prescriptions in parallel from Cloud B
    const [vitalsRes, rxRes] = await Promise.all([
      mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`),
      mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`)
    ]);

    res.json({
      patient: auth.patient,
      vitals: vitalsRes.data.vitals || [],
      prescriptions: rxRes.data.prescriptions || [],
      isBreakGlass: auth.isBreakGlass,
      breakGlassSession: auth.session || null,
      mtlsVerified: true
    });
  } catch (err) {
    console.error('Error fetching clinical summary over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch clinical summary from Cloud B', details: err.message });
  }
};

// Doctor gets appointment schedule from Cloud C (Azure)
exports.getAppointments = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const response = await mtlsClient.axios.get(`${mtlsClient.cloudCUrl}/api/appointments/doctor/${doctorId}`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching appointments over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch appointments from Cloud C via mTLS', details: err.message });
  }
};

// Doctor marks appointment complete in Cloud C
exports.completeAppointment = async (req, res) => {
  try {
    const response = await mtlsClient.axios.put(`${mtlsClient.cloudCUrl}/api/appointments/${req.params.id}/complete`);
    res.json(response.data);
  } catch (err) {
    console.error('Error completing appointment over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to complete appointment via mTLS', details: err.message });
  }
};

// Doctor gets patient vitals from Cloud B (Protected by Zero-Trust ABAC)
exports.getPatientVitals = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const { patientId } = req.params;

    const auth = await verifyDoctorPatientAccess(doctorId, patientId, req.user.name);
    if (!auth.authorized) {
      return res.status(auth.status).json(auth);
    }

    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`);
    res.json({
      ...response.data,
      isBreakGlass: auth.isBreakGlass,
      breakGlassSession: auth.session || null
    });
  } catch (err) {
    console.error('Error fetching vitals over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch patient vitals from Cloud B', details: err.message });
  }
};

// Doctor records new vitals in Cloud B
exports.recordPatientVitals = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const { patientId } = req.params;

    const auth = await verifyDoctorPatientAccess(doctorId, patientId, req.user.name);
    if (!auth.authorized) {
      return res.status(auth.status).json(auth);
    }

    const response = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/vitals`,
      {
        ...req.body,
        doctorId,
        recordedBy: req.user.name || 'Attending Physician'
      }
    );
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Error recording vitals over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to record vitals via Cloud B mTLS', details: err.message });
  }
};

// Doctor gets patient prescriptions from Cloud B (Protected by Zero-Trust ABAC)
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const { patientId } = req.params;

    const auth = await verifyDoctorPatientAccess(doctorId, patientId, req.user.name);
    if (!auth.authorized) {
      return res.status(auth.status).json(auth);
    }

    const response = await mtlsClient.axios.get(`${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`);
    res.json({
      ...response.data,
      isBreakGlass: auth.isBreakGlass,
      breakGlassSession: auth.session || null
    });
  } catch (err) {
    console.error('Error fetching prescriptions over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to fetch prescriptions from Cloud B', details: err.message });
  }
};

// Doctor issues new prescription in Cloud B
exports.issuePrescription = async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req);
    const { patientId } = req.params;

    const auth = await verifyDoctorPatientAccess(doctorId, patientId, req.user.name);
    if (!auth.authorized) {
      return res.status(auth.status).json(auth);
    }

    const response = await mtlsClient.axios.post(
      `${mtlsClient.cloudBUrl}/api/ehr/patients/${patientId}/prescriptions`,
      {
        ...req.body,
        doctorId,
        prescribedBy: req.user.name || 'Attending Physician'
      }
    );
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Error issuing prescription over mTLS:', err.message);
    res.status(500).json({ error: 'Failed to issue prescription via Cloud B mTLS', details: err.message });
  }
};
