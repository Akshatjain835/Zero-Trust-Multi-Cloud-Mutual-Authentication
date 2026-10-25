const store = require('../store');

exports.getAllAppointments = async (req, res) => {
  const appointments = await store.getAppointments();
  res.json({
    appointments,
    total: appointments.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getAppointmentById = async (req, res) => {
  const apt = await store.getAppointment(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ appointment: apt, mtlsVerified: req.mtls?.isAuthorized || false });
};

exports.getPatientAppointments = async (req, res) => {
  const patientApts = await store.getPatientAppointments(req.params.patientId);
  res.json({
    patientId: req.params.patientId,
    appointments: patientApts,
    count: patientApts.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorAppointments = async (req, res) => {
  const doctorApts = await store.getDoctorAppointments(req.params.doctorId);
  res.json({
    doctorId: req.params.doctorId,
    appointments: doctorApts,
    count: doctorApts.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.createAppointment = async (req, res) => {
  const { patientId, patientName, doctorId, doctorName, department, date, time, notes } = req.body;
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ error: 'patientId, doctorId, date, and time are required' });
  }

  const newApt = await store.addAppointment({
    patientId,
    patientName: patientName || 'Registered Patient',
    doctorId,
    doctorName: doctorName || 'Attending Physician',
    department: department || 'General Medicine',
    date,
    time,
    notes: notes || 'Consultation appointment',
    status: 'SCHEDULED',
    clientCN: req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth'
  });

  res.status(201).json({
    message: 'Appointment successfully scheduled in Cloud C (Azure Appointments)',
    appointment: newApt,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.completeAppointment = async (req, res) => {
  const apt = await store.completeAppointment(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({
    message: 'Appointment marked as COMPLETED in Cloud C',
    appointment: apt,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.cancelAppointment = async (req, res) => {
  const clientCN = req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth';
  const reason = req.body.reason || 'Cancelled by patient or physician';
  const apt = await store.cancelAppointment(req.params.id, reason, clientCN);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  res.json({
    message: 'Appointment cancelled successfully',
    appointment: apt,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

