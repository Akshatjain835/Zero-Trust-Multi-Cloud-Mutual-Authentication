const store = require('../store');

exports.getAllAppointments = (req, res) => {
  res.json({
    appointments: store.appointments,
    total: store.appointments.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getAppointmentById = (req, res) => {
  const apt = store.appointments.find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ appointment: apt, mtlsVerified: req.mtls?.isAuthorized || false });
};

exports.getPatientAppointments = (req, res) => {
  const patientApts = store.appointments
    .filter((a) => a.patientId === req.params.patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({
    patientId: req.params.patientId,
    appointments: patientApts,
    count: patientApts.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.getDoctorAppointments = (req, res) => {
  const doctorApts = store.appointments
    .filter((a) => a.doctorId === req.params.doctorId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({
    doctorId: req.params.doctorId,
    appointments: doctorApts,
    count: doctorApts.length,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.createAppointment = (req, res) => {
  const { patientId, patientName, doctorId, doctorName, department, date, time, notes } = req.body;
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ error: 'patientId, doctorId, date, and time are required' });
  }

  const newApt = store.addAppointment({
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

exports.completeAppointment = (req, res) => {
  const apt = store.completeAppointment(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({
    message: 'Appointment marked as COMPLETED in Cloud C',
    appointment: apt,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};

exports.cancelAppointment = (req, res) => {
  const apt = store.appointments.find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  apt.status = 'CANCELLED';
  apt.cancellationReason = req.body.reason || 'Cancelled by patient or physician';

  store.addAuditLog({
    clientCN: req.mtls?.clientCert?.subject?.CN || 'cloud-a-auth',
    action: 'CANCEL_APPOINTMENT',
    targetService: 'Cloud C - Azure Appointments',
    status: 'SUCCESS 200',
    details: `Appointment ${apt.id} cancelled. Reason: ${apt.cancellationReason}`
  });

  res.json({
    message: 'Appointment cancelled successfully',
    appointment: apt,
    mtlsVerified: req.mtls?.isAuthorized || false
  });
};
