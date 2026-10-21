import React, { useState, useEffect } from 'react';
import { User, Calendar, Stethoscope, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function PatientPortal({ user, token }) {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientId = user?.patientId || 'pat-1';

  useEffect(() => {
    const fetchPatientHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/patient/history?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatientData(res.data.patient);
        setAppointments(res.data.appointments || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch medical history');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientHistory();
  }, [patientId, token]);

  const pendingApts = appointments.filter((a) => a.status === 'PENDING' || a.status === 'SCHEDULED');
  const completedApts = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PATIENT DASHBOARD
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ color: '#06b6d4' }} size={24} />
              {patientData?.name || user?.name || 'John Doe'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Blood Group: <strong style={{ color: '#f8fafc' }}>{patientData?.bloodGroup || 'O+'}</strong> | Age: <strong style={{ color: '#f8fafc' }}>{patientData?.age || 42}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6,182,212,0.15)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} /> Authenticated Session
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
          Retrieving medical records & appointments...
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '1.5rem', color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Medical Overview */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText style={{ color: '#10b981' }} size={20} />
              My Medical Record Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Primary Diagnosis:</span>
                <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{patientData?.diagnosis || 'Hypertension'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Email Address:</span>
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{patientData?.email || user?.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Registered Since:</span>
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{patientData?.registeredAt || '2026-01-15'}</span>
              </div>
            </div>
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
