import React, { useState, useEffect } from 'react';
import { Stethoscope, Users, Calendar, ShieldCheck, CheckCircle2, Clock, Check } from 'lucide-react';
import axios from 'axios';

export default function DoctorPortal({ user, token }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const doctorId = user?.doctorId || 'doc-1';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assigned patients
      const patRes = await axios.get(`/api/doctor/patients?doctorId=${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(patRes.data.patients || []);

      // Fetch appointments schedule
      const aptRes = await axios.get(`/api/doctor/appointments?doctorId=${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(aptRes.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Doctor Data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [doctorId, token]);

  const handleMarkCompleted = async (aptId) => {
    try {
      await axios.put(`/api/doctor/appointments/${aptId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionSuccess(`Appointment ${aptId} marked as COMPLETED!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchData();
    } catch (err) {
      alert('Failed to mark appointment completed: ' + (err.response?.data?.error || err.message));
    }
  };

  const pendingApts = appointments.filter((a) => a.status === 'PENDING' || a.status === 'SCHEDULED');
  const completedApts = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DOCTOR DASHBOARD
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope style={{ color: '#818cf8' }} size={24} />
              {user?.name || 'Dr. Sarah Jenkins'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Specialty: Cardiology | Department: Cardiovascular Care
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.15)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} /> Authenticated Session
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
          Loading your patients and appointments schedule...
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '1.5rem', color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Patients Section */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users style={{ color: '#06b6d4' }} size={20} />
              My Assigned Patients ({patients.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {patients.length > 0 ? (
                patients.map((p) => (
                  <div key={p.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{p.name}</strong>
                      <span className="code-font" style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{p.id}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      Age: {p.age} | Blood: {p.bloodGroup}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Diagnosis: {p.diagnosis}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No patients assigned.</p>
              )}
            </div>
          </div>

          {/* Pending Appointments Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ color: '#fbbf24' }} size={20} />
              ⏳ Pending Appointments ({pendingApts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingApts.length > 0 ? (
                pendingApts.map((a) => (
                  <div key={a.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{a.patientName}</strong>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontWeight: '600' }}>
                          PENDING
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        📅 {a.date} at {a.time} • {a.department}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Notes: {a.notes}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkCompleted(a.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Check size={16} /> Mark as Completed
                    </button>
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
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{a.patientName}</strong>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: '600' }}>
                        COMPLETED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      📅 {a.date} at {a.time}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Consultation Notes: {a.notes}
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
