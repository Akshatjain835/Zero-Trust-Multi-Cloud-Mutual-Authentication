import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Users, Calendar, ShieldCheck, CheckCircle2, Clock, Check, 
  Activity, Pill, PlusCircle, AlertCircle, Eye, AlertTriangle, Flame, 
  ShieldAlert, Lock, Unlock, Timer, FileText, XCircle, HeartPulse, Sparkles, UserCheck
} from 'lucide-react';
import axios from 'axios';

export default function DoctorPortal({ user, token }) {
  // Registry states
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [emergencyPatients, setEmergencyPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Active view tab in patient selector
  const [patientTab, setPatientTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'EMERGENCY'

  // Selected Patient Clinical Inspection State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [loadingClinical, setLoadingClinical] = useState(false);
  const [abacDenied, setAbacDenied] = useState(null);

  // Emergency Break-Glass Protocol State
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassForm, setBreakGlassForm] = useState({
    emergencyCode: 'CODE_BLUE_CARDIAC_ARREST',
    justification: ''
  });
  const [submittingBreakGlass, setSubmittingBreakGlass] = useState(false);
  const [activeBreakGlass, setActiveBreakGlass] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Conclude Early Modal
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [concludeReason, setConcludeReason] = useState('Patient stabilized; care resumed under standard protocol.');
  const [submittingConclude, setSubmittingConclude] = useState(false);

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

  // 1. Fetch Hospital Patient Registry & Appointments
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch registry partitioned by Zero-Trust care team assignment
      const regRes = await axios.get(`/api/doctor/patients/registry?doctorId=${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assigned = regRes.data.assignedPatients || [];
      const emergency = regRes.data.emergencyPatients || [];
      setAssignedPatients(assigned);
      setEmergencyPatients(emergency);

      // Auto-select first assigned patient on load if none selected
      if (assigned.length > 0 && !selectedPatient) {
        selectPatient(assigned[0], false);
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

  useEffect(() => {
    fetchData();
  }, [doctorId, token]);

  // 2. Countdown Timer for Active Break-Glass Session
  useEffect(() => {
    if (!activeBreakGlass || !activeBreakGlass.expiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const checkTime = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeBreakGlass.expiresAt - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        // Ephemeral token expired
        setActiveBreakGlass(null);
        setActionSuccess('⚠️ Emergency Break-Glass session has expired. Zero-Trust access automatically revoked.');
        // Re-inspect patient to trigger the 403 screen
        if (selectedPatient) {
          selectPatient(selectedPatient, true);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [activeBreakGlass, selectedPatient]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 3. Select Patient & Enforce Zero-Trust ABAC
  const selectPatient = async (patient, isEmergency = false) => {
    setSelectedPatient(patient);
    setLoadingClinical(true);
    setAbacDenied(null);
    setClinicalData(null);

    try {
      const res = await axios.get(`/api/doctor/patients/${patient.id}/clinical-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClinicalData(res.data);
      if (res.data.isBreakGlass && res.data.breakGlassSession) {
        setActiveBreakGlass(res.data.breakGlassSession);
      } else if (!isEmergency) {
        setActiveBreakGlass(null);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Zero-Trust ABAC Intercept triggered!
        setAbacDenied(err.response.data);
        setActiveBreakGlass(null);
      } else {
        console.error('Error fetching clinical details:', err);
      }
    } finally {
      setLoadingClinical(false);
    }
  };

  // 4. Initiate Emergency Break-Glass Protocol
  const handleInitiateBreakGlass = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!breakGlassForm.justification || breakGlassForm.justification.trim().length < 10) {
      alert('Please provide a clinical justification of at least 10 characters.');
      return;
    }

    setSubmittingBreakGlass(true);
    try {
      const res = await axios.post(
        '/api/doctor/break-glass',
        {
          patientId: selectedPatient.id,
          emergencyCode: breakGlassForm.emergencyCode,
          justification: breakGlassForm.justification
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActionSuccess(`🚨 Break-Glass Override Authorized! Audit record #${res.data.session.sessionRef} committed to Azure Cloud C Ledger.`);
      setActiveBreakGlass(res.data.session);
      setShowBreakGlassModal(false);
      setBreakGlassForm({ emergencyCode: 'CODE_BLUE_CARDIAC_ARREST', justification: '' });

      // Reload patient under Break-Glass override
      selectPatient(selectedPatient, true);
    } catch (err) {
      alert('Break-Glass Initiation Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingBreakGlass(false);
    }
  };

  // 5. Conclude Emergency Session Early
  const handleConcludeBreakGlass = async () => {
    if (!selectedPatient) return;
    setSubmittingConclude(true);
    try {
      await axios.post(
        '/api/doctor/break-glass/conclude',
        {
          patientId: selectedPatient.id,
          reason: concludeReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActionSuccess(`🔒 Emergency Break-Glass concluded safely. Zero-Trust isolation restored for ${selectedPatient.name}.`);
      setActiveBreakGlass(null);
      setShowConcludeModal(false);

      // Re-trigger patient selection to show the 403 intercept
      selectPatient(selectedPatient, true);
      fetchData();
    } catch (err) {
      alert('Failed to conclude Break-Glass: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingConclude(false);
    }
  };

  // 6. Record Vitals & Issue Prescriptions
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
      selectPatient(selectedPatient, !!activeBreakGlass);
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
      selectPatient(selectedPatient, !!activeBreakGlass);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert('Failed to issue prescription: ' + (err.response?.data?.error || err.message));
    }
  };

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

  const pendingApts = appointments.filter((a) => a.status === 'PENDING' || a.status === 'SCHEDULED');
  const completedApts = appointments.filter((a) => a.status === 'COMPLETED');

  // Quick preset helper for Break-Glass justifications
  const applyPresetJustification = (code, text) => {
    setBreakGlassForm({
      emergencyCode: code,
      justification: text
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Physician Header */}
      <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PHYSICIAN DASHBOARD & ZERO-TRUST CLINICAL EHR GATEWAY
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope style={{ color: '#818cf8' }} size={24} />
              {user?.name || 'Dr. Sarah Jenkins'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Doctor ID: <span className="code-font" style={{ color: '#818cf8' }}>{doctorId}</span> | Verified Role: <strong style={{ color: '#f8fafc' }}>ATTENDING PHYSICIAN</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.15)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} /> Zero-Trust mTLS Verified
            </div>
            {activeBreakGlass && (
              <div className="emergency-pulse" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.25)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem', fontWeight: '700' }}>
                <Flame size={16} style={{ color: '#ef4444' }} /> BREAK-GLASS ACTIVE
              </div>
            )}
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}
      </div>

      {/* EMERGENCY BREAK-GLASS ACTIVE GLOWING BANNER */}
      {activeBreakGlass && (
        <div 
          className="emergency-pulse"
          style={{ 
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.35) 100%)', 
            border: '2px solid #ef4444', 
            borderRadius: '0.75rem', 
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444' }}>
              <Flame size={26} style={{ color: '#fca5a5' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#ef4444', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                  CRITICAL EMERGENCY OVERRIDE
                </span>
                <span className="code-font" style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                  REF: {activeBreakGlass.sessionRef}
                </span>
              </div>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#ffffff', fontSize: '1.15rem', fontWeight: '700' }}>
                Temporary Ephemeral Access Granted for {selectedPatient?.name || activeBreakGlass.patientName}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', color: '#fecaca', fontSize: '0.85rem' }}>
                Reason: <em>"{activeBreakGlass.justification}"</em> • Incident Code: <strong>{activeBreakGlass.emergencyCode}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: '700' }}>
                EPHEMERAL TTL REMAINING
              </div>
              <div className="code-font" style={{ fontSize: '1.6rem', fontWeight: '800', color: secondsRemaining < 120 ? '#fb7185' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Timer size={20} style={{ color: '#f87171' }} />
                {formatTimer(secondsRemaining)}
              </div>
            </div>

            <button
              onClick={() => setShowConcludeModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#090d16',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Lock size={16} /> Conclude Emergency & Relinquish Access
            </button>
          </div>
        </div>
      )}

      {/* Patient Selection Workspace */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPatientTab('ASSIGNED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: patientTab === 'ASSIGNED' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                color: patientTab === 'ASSIGNED' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <UserCheck size={16} />
              My Assigned Care Team ({assignedPatients.length})
            </button>
            <button
              onClick={() => setPatientTab('EMERGENCY')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: patientTab === 'EMERGENCY' ? '#dc2626' : 'rgba(255,255,255,0.05)',
                color: patientTab === 'EMERGENCY' ? '#ffffff' : '#f87171',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={16} />
              ER / Trauma Bay Registry ({emergencyPatients.length})
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {patientTab === 'ASSIGNED' ? (
              <span style={{ color: '#34d399' }}>✓ Authorized by Standard Care Team ABAC Policy</span>
            ) : (
              <span style={{ color: '#fb7185' }}>⚠️ Unassigned Hospital Patients — Zero-Trust ABAC Guard Active</span>
            )}
          </div>
        </div>

        {/* Patient Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {(patientTab === 'ASSIGNED' ? assignedPatients : emergencyPatients).map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            const isBreakGlassOnThisPatient = activeBreakGlass && activeBreakGlass.patientId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => selectPatient(p, patientTab === 'EMERGENCY')}
                style={{
                  background: isSelected 
                    ? (isBreakGlassOnThisPatient ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)')
                    : '#090d16',
                  padding: '1.1rem',
                  borderRadius: '0.6rem',
                  border: isSelected 
                    ? (isBreakGlassOnThisPatient ? '2px solid #ef4444' : '2px solid #6366f1')
                    : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Age: {p.age} • Gender: {p.gender} • Blood: <strong style={{ color: '#38bdf8' }}>{p.bloodGroup}</strong>
                    </div>
                  </div>
                  <span className="code-font" style={{ fontSize: '0.75rem', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {p.id}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                  Diagnosis: <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{p.diagnosis}</span>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {p.isAssigned ? (
                    <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Assigned Attending
                    </span>
                  ) : isBreakGlassOnThisPatient ? (
                    <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Flame size={12} style={{ color: '#ef4444' }} /> BREAK-GLASS ACTIVE
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Lock size={12} /> Unassigned (Dr. Vance)
                    </span>
                  )}

                  {isSelected && (
                    <span style={{ fontSize: '0.7rem', color: isBreakGlassOnThisPatient ? '#f87171' : '#818cf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Eye size={12} /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ZERO-TRUST ABAC ACCESS DENIED INTERCEPT CARD */}
      {abacDenied && (
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            border: '2px solid rgba(239,68,68,0.6)', 
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(15,23,42,0.9) 100%)',
            borderRadius: '1rem'
          }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.25)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={32} style={{ color: '#ef4444' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                  HTTP 403 ZERO-TRUST ABAC INTERCEPT
                </span>
                <span className="code-font" style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                  CLOUD B GCP POLICY ISOLATION
                </span>
              </div>

              <h3 style={{ margin: '0.25rem 0 0.5rem 0', color: '#f8fafc', fontSize: '1.35rem', fontWeight: '700' }}>
                Access Denied: Unassigned Patient ({abacDenied.patient?.name} - {abacDenied.patient?.id})
              </h3>

              <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Under <strong>NIST SP 800-207 Zero-Trust Architecture</strong>, clinical electronic health records are isolated by default.
                You (<span className="code-font" style={{ color: '#818cf8' }}>{doctorId} - Dr. Sarah Jenkins</span>) are not on the assigned care team for this patient.
                Primary Physician on record: <strong style={{ color: '#f8fafc' }}>Dr. Marcus Vance (doc-2 - Neurology)</strong>.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fca5a5', marginBottom: '0.15rem' }}>
                    🚨 Is this an Acute Clinical Life-Safety Emergency?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Physicians can invoke the <strong>Emergency Break-Glass Protocol</strong> to obtain temporary (10m) JIT read access. All actions are cryptographically notarized in the Azure Immutable Audit Ledger.
                  </div>
                </div>

                <button
                  onClick={() => setShowBreakGlassModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(239,68,68,0.5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Flame size={18} /> INITIATE EMERGENCY BREAK-GLASS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Workspace for Authorized or Break-Glass Patient */}
      {clinicalData && selectedPatient && (
        <div 
          className="glass-card" 
          style={{ 
            padding: '1.5rem', 
            borderLeft: clinicalData.isBreakGlass ? '4px solid #ef4444' : '4px solid #ec4899',
            background: clinicalData.isBreakGlass ? 'linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(15,23,42,0.8) 100%)' : undefined
          }}
        >
          {/* Patient Header & Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: clinicalData.isBreakGlass ? '#f87171' : '#f472b6', textTransform: 'uppercase' }}>
                  {clinicalData.isBreakGlass ? '🚨 EMERGENCY BREAK-GLASS EHR OVERRIDE' : 'CLINICAL EHR RECORD (CLOUD B GCP)'}
                </span>
                {clinicalData.isBreakGlass && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>
                    JIT OVERRIDE
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {clinicalData.patient.name}
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>
                  ({clinicalData.patient.id} • {clinicalData.patient.age}y {clinicalData.patient.gender})
                </span>
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

          {/* CRITICAL ALLERGIES & EMERGENCY SUMMARY BANNER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={14} /> CRITICAL DRUG ALLERGIES
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '700' }}>
                {clinicalData.patient.allergies && clinicalData.patient.allergies.length > 0 ? (
                  clinicalData.patient.allergies.join(', ')
                ) : (
                  <span style={{ color: '#34d399' }}>No Known Drug Allergies (NKDA)</span>
                )}
              </div>
            </div>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(56,189,248,0.3)', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                BLOOD TYPE & CODE STATUS
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '700' }}>
                Blood: <span style={{ color: '#38bdf8' }}>{clinicalData.patient.bloodGroup}</span> • {clinicalData.patient.codeStatus || 'FULL CODE'}
              </div>
            </div>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                EMERGENCY CONTACT
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {clinicalData.patient.emergencyContact || 'No Contact Specified'}
              </div>
            </div>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                PRIMARY ATTENDING PHYSICIAN
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {clinicalData.patient.primaryDoctorId === doctorId ? (
                  <span style={{ color: '#34d399', fontWeight: '600' }}>You (Dr. Sarah Jenkins - doc-1)</span>
                ) : (
                  <span style={{ color: '#fbbf24' }}>Dr. Marcus Vance (doc-2)</span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals & Prescriptions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Vitals Column */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.75rem 0' }}>
                <Activity size={16} style={{ color: '#ec4899' }} /> Vitals History ({clinicalData.vitals.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clinicalData.vitals.length > 0 ? (
                  clinicalData.vitals.map((v) => (
                    <div key={v.id} style={{ background: '#090d16', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        <span>{new Date(v.recordedAt).toLocaleString()}</span>
                        <span style={{ color: v.status === 'NORMAL' || v.status === 'OPTIMAL' ? '#34d399' : '#f472b6', fontWeight: '700' }}>
                          {v.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        HR: <strong>{v.heartRate} bpm</strong> | BP: <strong>{v.bloodPressure}</strong> | SpO2: <strong>{v.spO2}%</strong> | Temp: <strong>{v.temperature}°F</strong>
                      </div>
                      {v.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>{v.notes}</div>}
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
                <Pill size={16} style={{ color: '#a78bfa' }} /> Prescriptions ({clinicalData.prescriptions.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clinicalData.prescriptions.length > 0 ? (
                  clinicalData.prescriptions.map((rx) => (
                    <div key={rx.id} style={{ background: '#090d16', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>
                        <span>{rx.medication}</span>
                        <span style={{ fontSize: '0.7rem', color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {rx.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                        {rx.dosage} • {rx.frequency} ({rx.duration})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
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
        </div>
      )}

      {/* Emergency Break-Glass Justification Modal */}
      {showBreakGlassModal && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem', border: '2px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.375rem', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={20} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>
                    Emergency Break-Glass Protocol
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                    Target Patient: {selectedPatient.name} ({selectedPatient.id})
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowBreakGlassModal(false)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateBreakGlass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Emergency Incident Code */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '600' }}>
                  Select Clinical Emergency Incident Code
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { code: 'CODE_BLUE_CARDIAC_ARREST', label: '🚨 CODE BLUE: Cardiac Arrest' },
                    { code: 'ER_TRAUMA_UNRESPONSIVE', label: '⚡ ER TRAUMA: Unresponsive' },
                    { code: 'STAT_DRUG_ALLERGY_CHECK', label: '💊 STAT ALLERGY: Drug Check' },
                    { code: 'ICU_ACUTE_DECOMPENSATION', label: '🏥 ICU DECOMPENSATION' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setBreakGlassForm({ ...breakGlassForm, emergencyCode: item.code })}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        background: breakGlassForm.emergencyCode === item.code ? 'rgba(239,68,68,0.25)' : '#090d16',
                        border: breakGlassForm.emergencyCode === item.code ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                        color: breakGlassForm.emergencyCode === item.code ? '#ffffff' : '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Justifications */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Quick Fill Preset Justifications:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => applyPresetJustification('CODE_BLUE_CARDIAC_ARREST', 'Patient arrived unresponsive in ER Trauma Bay 2 with acute cardiac arrhythmia; immediate drug allergy and vital history required.')}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    + Code Blue Arrhythmia
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetJustification('STAT_DRUG_ALLERGY_CHECK', 'Acute anaphylactic shock suspected; emergency lookup of penicillin and NSAID contraindications before administering medication.')}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    + Anaphylaxis Drug Lookup
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetJustification('ER_TRAUMA_UNRESPONSIVE', 'Unconscious polytrauma intake; attending neurologist unreachable, immediate surgical baseline required.')}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    + Polytrauma Unconscious
                  </button>
                </div>
              </div>

              {/* Justification Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '600' }}>
                  Mandatory Clinical Justification (min. 10 chars)
                </label>
                <textarea
                  rows="3"
                  value={breakGlassForm.justification}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, justification: e.target.value })}
                  placeholder="Detail the urgent patient life-safety condition requiring emergency clinical data access..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc', fontSize: '0.85rem' }}
                  required
                />
              </div>

              {/* Compliance Warning */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem', color: '#fca5a5' }}>
                <strong>⚠️ AUDIT NOTICE:</strong> Invoking Break-Glass is an audited security override. This event will be broadcasted to the <strong>Azure Cloud C Immutable Ledger</strong> with your identity (<span className="code-font">{doctorId}</span>), cryptographic timestamp, and justification. Ephemeral access expires in <strong>10 minutes</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBreakGlassModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBreakGlass}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.375rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: submittingBreakGlass ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Flame size={16} />
                  {submittingBreakGlass ? 'Authorizing Over mTLS...' : 'Broadcast to Azure Audit & Break Glass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conclude Break-Glass Early Modal */}
      {showConcludeModal && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} style={{ color: '#34d399' }} /> Conclude Emergency Break-Glass
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
              Are you sure you want to conclude the emergency session for <strong>{selectedPatient.name}</strong>? Clinical access will immediately return to Zero-Trust isolation.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Conclusion Reason</label>
              <input
                type="text"
                value={concludeReason}
                onChange={(e) => setConcludeReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConcludeModal(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConcludeBreakGlass}
                disabled={submittingConclude}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', background: '#10b981', border: 'none', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                {submittingConclude ? 'Logging to Audit...' : 'Confirm & Relinquish Access'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Appointments Schedule Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Appointments */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ color: '#fbbf24' }} size={20} />
            Pending Appointments ({pendingApts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingApts.length > 0 ? (
              pendingApts.map((a) => (
                <div key={a.id} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{a.patientName}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontWeight: '600' }}>
                        PENDING
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      📅 {a.date} at {a.time} • {a.department}
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkCompleted(a.id)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Check size={14} /> Complete (Cloud C)
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No pending appointments.</p>
            )}
          </div>
        </div>

        {/* Completed Appointments */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ color: '#34d399' }} size={20} />
            Completed Appointments ({completedApts.length})
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
    </div>
  );
}
