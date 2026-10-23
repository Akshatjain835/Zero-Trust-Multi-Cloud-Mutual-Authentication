import React, { useState, useEffect } from 'react';
import { Stethoscope, Users, Calendar, ShieldCheck, CheckCircle2, Clock, Check, Activity, Pill, PlusCircle, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';

export default function DoctorPortal({ user, token }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Selected Patient Clinical Inspection State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingClinical, setLoadingClinical] = useState(false);

  // New Vitals Form State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    heartRate: '75',
    bloodPressure: '120/80',
    spO2: '98',
    temperature: '98.6',
    notes: ''
  });

  // New Prescription Form State
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({
    medication: '',
    dosage: '',
    frequency: 'Once daily',
    duration: '30 days',
    instructions: ''
  });

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

      // Automatically select first patient if none selected
      if (patRes.data.patients && patRes.data.patients.length > 0 && !selectedPatient) {
        selectPatientForClinical(patRes.data.patients[0]);
      }

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

  const selectPatientForClinical = async (patient) => {
    setSelectedPatient(patient);
    setLoadingClinical(true);
    try {
      const [vitalsRes, rxRes] = await Promise.all([
        axios.get(`/api/doctor/patients/${patient.id}/vitals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/doctor/patients/${patient.id}/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPatientVitals(vitalsRes.data.vitals || []);
      setPatientPrescriptions(rxRes.data.prescriptions || []);
    } catch (err) {
      console.error('Error fetching clinical details:', err);
    } finally {
      setLoadingClinical(false);
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
      setActionSuccess(`Appointment ${aptId} marked as COMPLETED in Cloud C!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchData();
    } catch (err) {
      alert('Failed to mark appointment completed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await axios.post(
        `/api/doctor/patients/${selectedPatient.id}/vitals`,
        vitalsForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionSuccess(`Clinical vitals recorded in Cloud B EHR for ${selectedPatient.name}!`);
      setShowVitalsModal(false);
      setVitalsForm({ heartRate: '75', bloodPressure: '120/80', spO2: '98', temperature: '98.6', notes: '' });
      selectPatientForClinical(selectedPatient);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert('Failed to record vitals: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await axios.post(
        `/api/doctor/patients/${selectedPatient.id}/prescriptions`,
        rxForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionSuccess(`Prescription for ${rxForm.medication} issued in Cloud B!`);
      setShowRxModal(false);
      setRxForm({ medication: '', dosage: '', frequency: 'Once daily', duration: '30 days', instructions: '' });
      selectPatientForClinical(selectedPatient);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert('Failed to issue prescription: ' + (err.response?.data?.error || err.message));
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
              PHYSICIAN DASHBOARD (CLOUD B EHR & CLOUD C APPOINTMENTS)
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope style={{ color: '#818cf8' }} size={24} />
              {user?.name || 'Dr. Sarah Jenkins'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Doctor ID: <span className="code-font" style={{ color: '#818cf8' }}>{doctorId}</span> | Verified Role: <strong style={{ color: '#f8fafc' }}>ATTENDING PHYSICIAN</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.15)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} /> Zero-Trust mTLS Session Verified
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}
      </div>

      {/* Record Vitals Modal */}
      {showVitalsModal && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', border: '1px solid rgba(236,72,153,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: '#ec4899' }} /> Record Vitals for {selectedPatient.name}
              </h3>
              <button onClick={() => setShowVitalsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleRecordVitals} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Blood Pressure (e.g. 120/80)</label>
                  <input
                    type="text"
                    value={vitalsForm.bloodPressure}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitalsForm.spO2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Clinical Observations</label>
                <textarea
                  rows="2"
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                  placeholder="e.g. Normal sinus rhythm, well compensated"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', background: '#ec4899', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Commit Vitals (Cloud B mTLS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Prescription Modal */}
      {showRxModal && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={18} style={{ color: '#a78bfa' }} /> Issue Prescription for {selectedPatient.name}
              </h3>
              <button onClick={() => setShowRxModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleIssuePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Medication Name</label>
                <input
                  type="text"
                  value={rxForm.medication}
                  onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })}
                  placeholder="e.g. Metoprolol Tartrate, Amoxicillin"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Dosage (e.g. 25mg)</label>
                  <input
                    type="text"
                    value={rxForm.dosage}
                    onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                    placeholder="e.g. 50mg"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Frequency</label>
                  <select
                    value={rxForm.frequency}
                    onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Duration</label>
                <input
                  type="text"
                  value={rxForm.duration}
                  onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                  placeholder="e.g. 30 days, 14 days"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Patient Instructions</label>
                <textarea
                  rows="2"
                  value={rxForm.instructions}
                  onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                  placeholder="e.g. Take with water after breakfast."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', background: '#8b5cf6', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Issue Rx (Cloud B mTLS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              My Assigned Patients ({patients.length}) — Click to Inspect Clinical EHR
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {patients.length > 0 ? (
                patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectPatientForClinical(p)}
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.15)' : '#090d16',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
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
                      {isSelected && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#818cf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Eye size={12} /> Currently Selected for EHR Actions
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No patients assigned.</p>
              )}
            </div>
          </div>

          {/* Clinical Workspace for Selected Patient */}
          {selectedPatient && (
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f472b6', textTransform: 'uppercase' }}>
                    CLINICAL EHR RECORD (CLOUD B)
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0.2rem 0', color: '#f8fafc' }}>
                    {selectedPatient.name} — Medical History & Prescriptions
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowVitalsModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(236,72,153,0.2)',
                      border: '1px solid rgba(236,72,153,0.4)',
                      color: '#f472b6',
                      borderRadius: '0.375rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={16} /> Record Vitals
                  </button>
                  <button
                    onClick={() => setShowRxModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(139,92,246,0.2)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      color: '#c4b5fd',
                      borderRadius: '0.375rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={16} /> Issue Prescription
                  </button>
                </div>
              </div>

              {loadingClinical ? (
                <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>Loading clinical EHR records over mTLS...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Vitals Column */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.75rem 0' }}>
                      <Activity size={16} style={{ color: '#ec4899' }} /> Vitals History ({patientVitals.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {patientVitals.length > 0 ? (
                        patientVitals.map((v) => (
                          <div key={v.id} style={{ background: '#090d16', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              <span>{new Date(v.recordedAt).toLocaleDateString()}</span>
                              <span style={{ color: v.status === 'NORMAL' || v.status === 'OPTIMAL' ? '#34d399' : '#f472b6', fontWeight: '700' }}>
                                {v.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              HR: <strong>{v.heartRate} bpm</strong> | BP: <strong>{v.bloodPressure}</strong> | SpO2: <strong>{v.spO2}%</strong>
                            </div>
                            {v.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>{v.notes}</div>}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>No vitals recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Prescriptions Column */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.75rem 0' }}>
                      <Pill size={16} style={{ color: '#a78bfa' }} /> Prescriptions ({patientPrescriptions.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {patientPrescriptions.length > 0 ? (
                        patientPrescriptions.map((rx) => (
                          <div key={rx.id} style={{ background: '#090d16', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>
                              <span>{rx.medication}</span>
                              <span style={{ fontSize: '0.7rem', color: '#c4b5fd' }}>{rx.status}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              {rx.dosage} • {rx.frequency} ({rx.duration})
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                              {rx.instructions}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>No prescriptions issued.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                      <Check size={16} /> Mark Completed (Cloud C)
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
                  <div key={a.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{a.patientName}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        📅 {a.date} at {a.time} • Status: <span style={{ color: '#34d399' }}>COMPLETED</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                      Verified in Cloud C
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No completed appointments.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
