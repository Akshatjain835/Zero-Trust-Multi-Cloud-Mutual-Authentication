import React, { useState, useEffect } from 'react';
import { ShieldCheck, HeartPulse, LogIn, LogOut, Key, UserCheck, Stethoscope, User, Activity, X } from 'lucide-react';
import axios from 'axios';

import LandingPage from './components/LandingPage';
import AdminPortal from './components/AdminPortal';
import DoctorPortal from './components/DoctorPortal';
import PatientPortal from './components/PatientPortal';
import ZeroTrustVisualizer from './components/ZeroTrustVisualizer';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'visualizer'

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@health.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState('ADMIN'); // 'ADMIN' | 'DOCTOR' | 'PATIENT'
  const [loginError, setLoginError] = useState(null);

  // Mesh Health Data for visualizer
  const [healthData, setHealthData] = useState(null);

  const fetchMeshHealth = async () => {
    try {
      const res = await axios.get('/api/system/health');
      setHealthData(res.data);
    } catch (err) {
      console.error('Error fetching mesh health:', err);
    }
  };

  useEffect(() => {
    fetchMeshHealth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await axios.post('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
        role: selectedRole
      });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      setShowLoginModal(false);
      setActiveTab('dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    setActiveTab('dashboard');
  };

  const selectPresetRole = (role) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setLoginEmail('admin@health.com');
      setLoginPassword('admin123');
    } else if (role === 'DOCTOR') {
      setLoginEmail('sarah.jenkins@health.com');
      setLoginPassword('doctor123');
    } else if (role === 'PATIENT') {
      setLoginEmail('john.doe@patient.com');
      setLoginPassword('patient123');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Navigation Header */}
      <header className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)', color: '#fff' }}>
            <HeartPulse size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              MediTrust Healthcare
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Doctor & Patient Care Platform
            </span>
          </div>
        </div>

        {/* Right Session Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* 3-Cloud Zero-Trust Mesh & Audit link (Restricted to Administrator) */}
          {user?.role === 'ADMIN' ? (
            <button
              onClick={() => setActiveTab(activeTab === 'visualizer' ? 'dashboard' : 'visualizer')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                background: activeTab === 'visualizer' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${activeTab === 'visualizer' ? '#818cf8' : 'rgba(255,255,255,0.12)'}`,
                color: activeTab === 'visualizer' ? '#c7d2fe' : '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ShieldCheck size={14} style={{ color: '#10b981' }} /> {activeTab === 'visualizer' ? 'Back to Admin Portal' : '3-Cloud mTLS & Audit Ledger'}
            </button>
          ) : !user ? (
            <button
              onClick={() => setActiveTab(activeTab === 'visualizer' ? 'dashboard' : 'visualizer')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Activity size={14} /> 3-Cloud mTLS Mesh
            </button>
          ) : null}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>{user.name}</div>
                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '9999px', background: user.role === 'ADMIN' ? 'rgba(99,102,241,0.2)' : user.role === 'DOCTOR' ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)', color: user.role === 'ADMIN' ? '#a5b4fc' : user.role === 'DOCTOR' ? '#67e8f9' : '#6ee7b7', fontWeight: '600' }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(244,63,94,0.15)',
                  border: '1px solid rgba(244,63,94,0.3)',
                  color: '#fb7185',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'visualizer' ? (
          <ZeroTrustVisualizer
            healthData={healthData}
            refreshHealth={fetchMeshHealth}
            user={user}
            onOpenLogin={(role) => {
              selectPresetRole(role || 'ADMIN');
              setShowLoginModal(true);
            }}
          />
        ) : !user ? (
          /* Logged Out -> Display Minimal Landing Page */
          <LandingPage onOpenLogin={() => setShowLoginModal(true)} />
        ) : (
          /* Logged In -> Dedicated Clean Dashboards */
          <>
            {user.role === 'ADMIN' && (
              <AdminPortal
                token={token}
                onOpenVisualizer={() => setActiveTab('visualizer')}
              />
            )}
            {user.role === 'DOCTOR' && <DoctorPortal user={user} token={token} />}
            {user.role === 'PATIENT' && <PatientPortal user={user} token={token} />}
          </>
        )}
      </main>

      {/* Sign In Modal with Role Selector */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', border: '1px solid rgba(255,255,255,0.15)', position: 'relative' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key style={{ color: '#06b6d4' }} size={22} />
              Sign In to Your Account
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
              Please enter your credentials and select your access role.
            </p>

            {/* Role Selector Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem', borderRadius: '0.5rem' }}>
              <button
                type="button"
                onClick={() => selectPresetRole('PATIENT')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: selectedRole === 'PATIENT' ? '#06b6d4' : 'transparent',
                  color: selectedRole === 'PATIENT' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <User size={14} /> Patient
              </button>
              <button
                type="button"
                onClick={() => selectPresetRole('DOCTOR')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: selectedRole === 'DOCTOR' ? '#6366f1' : 'transparent',
                  color: selectedRole === 'DOCTOR' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <Stethoscope size={14} /> Doctor
              </button>
              <button
                type="button"
                onClick={() => selectPresetRole('ADMIN')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: selectedRole === 'ADMIN' ? '#10b981' : 'transparent',
                  color: selectedRole === 'ADMIN' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <UserCheck size={14} /> Admin
              </button>
            </div>

            {loginError && (
              <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.375rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.5rem', borderRadius: '0.375rem', background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
