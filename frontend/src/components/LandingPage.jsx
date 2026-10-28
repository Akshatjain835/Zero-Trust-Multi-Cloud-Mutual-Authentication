import React from 'react';
import { ShieldCheck, Stethoscope, User, Lock, HeartPulse, ArrowRight, Activity, CheckCircle, Calendar } from 'lucide-react';

export default function LandingPage({ onOpenLogin, onOpenVault, onOpenVisualizer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
      {/* Hero Banner */}
      <div
        className="glass-card"
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22d3ee', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          <HeartPulse size={16} /> Healthcare Management Platform
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: '0 0 1rem 0', color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
          Simplified Healthcare for <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Doctors & Patients</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          Manage consultations, view assigned patient rosters, track pending vs. completed medical appointments, and protect patient privacy with Multi-Cloud Zero-Trust mTLS security.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            id="hero-signin-btn"
            onClick={onOpenLogin}
            style={{
              padding: '0.85rem 2.25rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(6, 182, 212, 0.35)'
            }}
          >
            Sign In to Dashboard <ArrowRight size={18} />
          </button>

          {onOpenVault && (
            <button
              id="hero-vault-btn"
              onClick={onOpenVault}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                border: '1px solid rgba(168,85,247,0.5)',
                color: '#e9d5ff',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 25px rgba(168,85,247,0.25)'
              }}
            >
              <Lock size={18} style={{ color: '#c084fc' }} /> 🔑 Shamir Threshold Vault Lab
            </button>
          )}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Doctor Card */}
        <div className="glass-card glass-card-hover" style={{ padding: '2rem', borderTop: '4px solid #6366f1' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: '1.25rem' }}>
            <Stethoscope size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            For Doctors
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
            Access assigned patient profiles, view patient diagnoses, manage pending consultation queues, and mark finished appointments as completed.
          </p>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> Assigned patient list</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> Pending & completed queues</li>
          </ul>
        </div>

        {/* Patient Card */}
        <div className="glass-card glass-card-hover" style={{ padding: '2rem', borderTop: '4px solid #06b6d4' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', marginBottom: '1.25rem' }}>
            <User size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            For Patients
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
            Review your medical record details, view upcoming doctor consultations, and track previous doctor notes and completed appointments.
          </p>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> Personal health record</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> Past doctor consultations</li>
          </ul>
        </div>

        {/* Shamir (k,n) Vault Card */}
        <div
          className="glass-card glass-card-hover"
          style={{ padding: '2rem', borderTop: '4px solid #a855f7', cursor: onOpenVault ? 'pointer' : 'default' }}
          onClick={onOpenVault}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', marginBottom: '1.25rem' }}>
            <Lock size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            Shamir (k=2, n=3) Vault
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
            Polynomial key splitting over finite field F_p. 1 compromised cloud leaks 0.00% data. Any 2 clouds recover Master AES-256 Key.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.5rem' }}>
            Launch Mathematical Lab <ArrowRight size={14} />
          </div>
        </div>

        {/* Zero-Trust Security Card */}
        <div className="glass-card glass-card-hover" style={{ padding: '2rem', borderTop: '4px solid #10b981' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '1.25rem' }}>
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            Zero-Trust Protection
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
            Inter-cloud microservices (AWS, GCP, Azure) authenticate via X.509 Mutual TLS certificates, ensuring zero untrusted network access.
          </p>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> mTLS X.509 certificates</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#34d399' }} /> Strict data isolation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
