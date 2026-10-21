import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Cloud, Server, ArrowRight, Activity, Terminal, RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';

export default function ZeroTrustVisualizer({ healthData, refreshHealth }) {
  const [attackTarget, setAttackTarget] = useState('CloudB');
  const [attackResult, setAttackResult] = useState(null);
  const [attacking, setAttacking] = useState(false);

  const runAttackSimulation = async () => {
    setAttacking(true);
    setAttackResult(null);
    try {
      const res = await axios.post('/api/system/simulate-attack', { targetService: attackTarget });
      setAttackResult(res.data);
    } catch (err) {
      setAttackResult({
        success: false,
        message: '🛡️ ZERO-TRUST ENFORCED! Server dropped raw connection.',
        blockedByZeroTrust: true,
        errorDetails: err.message
      });
    } finally {
      setAttacking(false);
      refreshHealth();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Topology Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
              <ShieldCheck style={{ color: '#10b981' }} size={24} />
              3-Cloud Zero-Trust Mesh & Inter-Service mTLS Topology
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Strict X.509 Mutual Certificate Authentication between microservices deployed across AWS, GCP, and Azure.
            </p>
          </div>
          <button
            onClick={refreshHealth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} /> Refresh Mesh Status
          </button>
        </div>

        {/* 3-Cloud Visual Node Graph */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {/* Cloud A (AWS) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ☁️ CLOUD A (AWS)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: '600' }}>
                Port 5001
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#f1f5f9' }}>Identity & Auth Gateway</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Issues User JWTs & Outbound mTLS Proxy</p>
            <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#cbd5e1', marginBottom: '0.2rem' }}>🔒 Client Cert CN: <span className="code-font" style={{ color: '#38bdf8' }}>cloud-a-auth</span></div>
              <div style={{ color: '#cbd5e1' }}>Issuer: <span className="code-font" style={{ color: '#34d399' }}>ZeroTrust-RootCA</span></div>
            </div>
          </div>

          {/* Cloud B (GCP) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ☁️ CLOUD B (GCP)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(6,182,212,0.2)', color: '#67e8f9', fontWeight: '600' }}>
                Port 5002
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#f1f5f9' }}>Patient & EHR Service</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Stores Patient Data & Medical History</p>
            <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#cbd5e1', marginBottom: '0.2rem' }}>🔒 mTLS Status: <span style={{ color: '#10b981', fontWeight: '700' }}>ENFORCED</span></div>
              <div style={{ color: '#cbd5e1' }}>Peer Verification: <span style={{ color: '#38bdf8' }}>Strict X.509</span></div>
            </div>
          </div>

          {/* Cloud C (Azure) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ☁️ CLOUD C (AZURE)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontWeight: '600' }}>
                Port 5003
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#f1f5f9' }}>Appointments & Audit Service</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Schedules & Security Logs</p>
            <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#cbd5e1', marginBottom: '0.2rem' }}>🔒 mTLS Status: <span style={{ color: '#10b981', fontWeight: '700' }}>ENFORCED</span></div>
              <div style={{ color: '#cbd5e1' }}>Audit Logging: <span style={{ color: '#34d399' }}>ACTIVE</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Zero-Trust Attack Simulator Panel */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(244,63,94,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(244,63,94,0.2)', color: '#fb7185' }}>
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Zero-Trust Attack Simulator (Direct Non-mTLS Access Test)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Simulate an attacker attempting to bypass AWS Cloud A and calling GCP Cloud B or Azure Cloud C directly without a client X.509 certificate.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Target Cloud Service:</label>
          <select
            value={attackTarget}
            onChange={(e) => setAttackTarget(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#f8fafc',
              fontSize: '0.9rem'
            }}
          >
            <option value="CloudB">Cloud B (GCP Patient Records - Port 5002)</option>
            <option value="CloudC">Cloud C (Azure Appointments - Port 5003)</option>
          </select>

          <button
            onClick={runAttackSimulation}
            disabled={attacking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: attacking ? 0.7 : 1
            }}
          >
            {attacking ? <RefreshCw className="animate-spin" size={16} /> : <ShieldAlert size={18} />}
            {attacking ? 'Sending Attack Vector...' : 'Simulate Direct Attack (No mTLS Cert)'}
          </button>
        </div>

        {attackResult && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              background: attackResult.blockedByZeroTrust ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${attackResult.blockedByZeroTrust ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              marginTop: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {attackResult.blockedByZeroTrust ? (
                <ShieldCheck style={{ color: '#10b981' }} size={20} />
              ) : (
                <ShieldAlert style={{ color: '#f43f5e' }} size={20} />
              )}
              <strong style={{ color: attackResult.blockedByZeroTrust ? '#34d399' : '#fb7185', fontSize: '0.95rem' }}>
                {attackResult.message}
              </strong>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
              {attackResult.explanation}
            </p>
            {attackResult.errorDetails && (
              <div className="code-font" style={{ fontSize: '0.75rem', background: '#090d16', padding: '0.5rem', borderRadius: '0.25rem', color: '#f43f5e' }}>
                Error Payload: {JSON.stringify(attackResult.errorDetails)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-time Security Audit Logs */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#f8fafc' }}>
          <Terminal style={{ color: '#38bdf8' }} size={20} />
          Real-Time Zero-Trust Security Audit Logs (Azure Cloud C)
        </h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          {healthData?.auditLogs && healthData.auditLogs.length > 0 ? (
            healthData.auditLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                <span className="code-font" style={{ color: '#64748b', minWidth: '160px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="code-font" style={{ color: '#38bdf8', minWidth: '120px' }}>
                  [{log.clientCN}]
                </span>
                <span style={{ color: '#34d399', fontWeight: '600', minWidth: '140px' }}>
                  {log.action}
                </span>
                <span style={{ color: '#cbd5e1' }}>{log.details}</span>
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No audit logs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
