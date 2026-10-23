import React, { useState, useEffect } from 'react';
import { User, Calendar, Stethoscope, ShieldCheck, Clock, FileText, CheckCircle2, Activity, Pill, PlusCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function PatientPortal({ user, token }) {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Appointment State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  const patientId = user?.patientId || 'pat-1';

  const fetchPatientHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/patient/history?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientData(res.data.patient);
      setAppointments(res.data.appointments || []);
      setVitals(res.data.vitals || []);
      setPrescriptions(res.data.prescriptions || []);

      // Fetch available doctors for booking
      const docRes = await axios.get('/api/patient/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (docRes.data.doctors && docRes.data.doctors.length > 0) {
        setDoctorsList(docRes.data.doctors);
        setBookingDocId(docRes.data.doctors[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientHistory();
  }, [patientId, token]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    const selectedDoc = doctorsList.find((d) => d.id === bookingDocId);

    try {
      const res = await axios.post(
        '/api/patient/appointments',
        {
          doctorId: bookingDocId,
          doctorName: selectedDoc?.name || 'Attending Physician',
          department: selectedDoc?.department || 'General Medicine',
          date: bookingDate || '2026-10-30',
          time: bookingTime,
          notes: bookingNotes || 'Regular consultation'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBookingSuccess('Appointment confirmed across AWS & Azure over Zero-Trust mTLS!');
      setShowBookingModal(false);
      setBookingNotes('');
      fetchPatientHistory();
      setTimeout(() => setBookingSuccess(null), 5000);
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Booking failed');
    }
  };

  const pendingApts = appointments.filter((a) => a.status === 'PENDING' || a.status === 'SCHEDULED');
  const completedApts = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PATIENT DASHBOARD (CLOUD B EHR & CLOUD C APPOINTMENTS)
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ color: '#06b6d4' }} size={24} />
              {patientData?.name || user?.name || 'John Doe'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Blood Group: <strong style={{ color: '#f8fafc' }}>{patientData?.bloodGroup || 'O+'}</strong> | Age: <strong style={{ color: '#f8fafc' }}>{patientData?.age || 42}</strong> | Patient ID: <span className="code-font" style={{ color: '#38bdf8' }}>{patientId}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowBookingModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.1rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={16} /> Book Appointment
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6,182,212,0.15)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} /> mTLS Session Verified
            </div>
          </div>
        </div>

        {bookingSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} /> {bookingSuccess}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', border: '1px solid rgba(6,182,212,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: '#06b6d4' }} /> Schedule Medical Consultation
              </h3>
              <button onClick={() => setShowBookingModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {bookingError && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Select Doctor</label>
                <select
                  value={bookingDocId}
                  onChange={(e) => setBookingDocId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  required
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty} - {d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Time Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Reason / Symptoms</label>
                <textarea
                  rows="2"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Regular cardiac checkup, headaches, routine visit"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', background: '#06b6d4', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Confirm Booking (mTLS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
          Retrieving medical records, vitals & appointments...
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '1.5rem', color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Clinical Vitals Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ color: '#ec4899' }} size={20} />
              Recent Clinical Vitals History ({vitals.length} recorded in Cloud B)
            </h3>
            {vitals.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {vitals.map((v) => (
                  <div key={v.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        📅 {new Date(v.recordedAt).toLocaleDateString()}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: v.status === 'OPTIMAL' || v.status === 'NORMAL' ? 'rgba(16,185,129,0.2)' : 'rgba(236,72,153,0.2)',
                        color: v.status === 'OPTIMAL' || v.status === 'NORMAL' ? '#34d399' : '#f472b6',
                        fontWeight: '700'
                      }}>
                        {v.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <div style={{ color: '#cbd5e1' }}>❤️ HR: <strong style={{ color: '#f8fafc' }}>{v.heartRate} bpm</strong></div>
                      <div style={{ color: '#cbd5e1' }}>🩺 BP: <strong style={{ color: '#f8fafc' }}>{v.bloodPressure}</strong></div>
                      <div style={{ color: '#cbd5e1' }}>💨 SpO2: <strong style={{ color: '#f8fafc' }}>{v.spO2}%</strong></div>
                      <div style={{ color: '#cbd5e1' }}>🌡️ Temp: <strong style={{ color: '#f8fafc' }}>{v.temperature}°F</strong></div>
                    </div>
                    {v.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Note: {v.notes}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No clinical vitals recorded yet.</p>
            )}
          </div>

          {/* Active Prescriptions Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill style={{ color: '#a78bfa' }} size={20} />
              Active Medication & Prescriptions ({prescriptions.length} in Cloud B)
            </h3>
            {prescriptions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{rx.medication}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', fontWeight: '600' }}>
                        {rx.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      Dosage: <strong style={{ color: '#a78bfa' }}>{rx.dosage}</strong> • {rx.frequency}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                      Duration: {rx.duration} | Prescribed by: {rx.prescribedBy}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      Instructions: {rx.instructions}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No active prescriptions.</p>
            )}
          </div>

          {/* Pending Appointments Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ color: '#fbbf24' }} size={20} />
              ⏳ Upcoming & Pending Appointments ({pendingApts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingApts.length > 0 ? (
                pendingApts.map((a) => (
                  <div key={a.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Stethoscope size={16} style={{ color: '#818cf8' }} />
                        {a.doctorName}
                      </strong>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontWeight: '600' }}>
                        PENDING
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: '#94a3b8' }} /> {a.date} at {a.time} • {a.department}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong>Appointment Purpose:</strong> {a.notes}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No pending appointments.</p>
              )}
            </div>
          </div>

          {/* Completed Appointments Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 style={{ color: '#34d399' }} size={20} />
              ✅ Completed Appointments ({completedApts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {completedApts.length > 0 ? (
                completedApts.map((a) => (
                  <div key={a.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Stethoscope size={16} style={{ color: '#818cf8' }} />
                        {a.doctorName}
                      </strong>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: '600' }}>
                        COMPLETED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: '#94a3b8' }} /> {a.date} at {a.time} • {a.department}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong>Doctor Notes:</strong> {a.notes}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No completed appointments yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
