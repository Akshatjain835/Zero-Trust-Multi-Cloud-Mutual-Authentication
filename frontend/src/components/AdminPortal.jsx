import React, { useState, useEffect } from 'react';
import { UserPlus, Stethoscope, Users, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function AdminPortal({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('register-doctor');
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);

  // Form states
  const [docForm, setDocForm] = useState({ name: '', email: '', password: 'doctor123', specialty: '', department: '' });
  const [patForm, setPatForm] = useState({ name: '', email: '', password: 'patient123', age: 30, gender: 'Male', bloodGroup: 'O+', primaryDoctorId: '', diagnosis: '' });
  
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const docRes = await axios.get('/api/doctor/patients?doctorId=doc-1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (docRes.data.patients) setPatientsList(docRes.data.patients);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/admin/register-doctor', docForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Doctor ${res.data.doctor.name} registered via AWS->GCP mTLS!` });
      setDocForm({ name: '', email: '', password: 'doctor123', specialty: '', department: '' });
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/admin/register-patient', patForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Patient ${res.data.patient.name} registered via AWS->GCP mTLS!` });
      setPatForm({ name: '', email: '', password: 'patient123', age: 30, gender: 'Male', bloodGroup: 'O+', primaryDoctorId: '', diagnosis: '' });
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Admin Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ color: '#6366f1' }} size={24} />
              Administrator Control Center (Cloud A Gateway)
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Register new Healthcare Professionals & Patients. Data payloads are encrypted & verified via mTLS between AWS & GCP.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveSubTab('register-doctor')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeSubTab === 'register-doctor' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Stethoscope size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Register Doctor
            </button>
            <button
              onClick={() => setActiveSubTab('register-patient')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeSubTab === 'register-patient' ? '#06b6d4' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Register Patient
            </button>
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              color: message.type === 'success' ? '#34d399' : '#fb7185',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}
      </div>

      {/* Forms Section */}
      {activeSubTab === 'register-doctor' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: '#818cf8' }}>
            👨‍⚕️ Register New Doctor (Pushed to Cloud B over mTLS)
          </h3>
          <form onSubmit={handleRegisterDoctor} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Doctor Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Alexander Smith"
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="alexander.smith@health.com"
                value={docForm.email}
                onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Sign-in Password</label>
              <input
                type="text"
                required
                value={docForm.password}
                onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Specialty</label>
              <input
                type="text"
                required
                placeholder="Cardiology / Neurology"
                value={docForm.specialty}
                onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Department</label>
              <input
                type="text"
                required
                placeholder="Internal Medicine"
                value={docForm.department}
                onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing mTLS Transaction...' : 'Register Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'register-patient' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: '#22d3ee' }}>
            🩺 Register New Patient (Pushed to Cloud B over mTLS)
          </h3>
          <form onSubmit={handleRegisterPatient} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Patient Name</label>
              <input
                type="text"
                required
                placeholder="Alice Johnson"
                value={patForm.name}
                onChange={(e) => setPatForm({ ...patForm, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="alice.johnson@patient.com"
                value={patForm.email}
                onChange={(e) => setPatForm({ ...patForm, email: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Age</label>
              <input
                type="number"
                required
                value={patForm.age}
                onChange={(e) => setPatForm({ ...patForm, age: parseInt(e.target.value) || 30 })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Blood Group</label>
              <select
                value={patForm.bloodGroup}
                onChange={(e) => setPatForm({ ...patForm, bloodGroup: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Assign Primary Doctor ID</label>
              <select
                value={patForm.primaryDoctorId}
                onChange={(e) => setPatForm({ ...patForm, primaryDoctorId: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              >
                <option value="doc-1">Dr. Sarah Jenkins (Cardiology)</option>
                <option value="doc-2">Dr. Marcus Vance (Neurology)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Initial Diagnosis / Notes</label>
              <input
                type="text"
                required
                placeholder="Mild Asthma / Routine checkup"
                value={patForm.diagnosis}
                onChange={(e) => setPatForm({ ...patForm, diagnosis: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#06b6d4',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing mTLS Transaction...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
