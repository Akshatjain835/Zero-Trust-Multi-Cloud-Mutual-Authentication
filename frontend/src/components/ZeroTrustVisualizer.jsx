import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Cloud,
  Server,
  ArrowRight,
  Activity,
  Terminal,
  RefreshCw,
  Zap,
  Flame,
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronRight,
  FileCode,
  Layers,
  Cpu,
  Radio,
  Eye,
  LogIn
} from 'lucide-react';
import axios from 'axios';

const ATTACK_VECTORS = [
  {
    id: 'NO_CERT',
    name: 'Rogue Microservice Ingress',
    badge: 'Layer 4 / TLS',
    threatCategory: 'Direct Perimeter Bypass',
    shortDesc: 'Raw HTTPS request with no X.509 client certificate',
    targetOptions: [
      { id: 'CloudB', label: 'Cloud B (GCP EHR - Port 5002)' },
      { id: 'CloudC', label: 'Cloud C (Azure Appointments - Port 5003)' }
    ],
    payloadPreview: {
      protocol: 'HTTPS / TLS 1.3',
      tlsAgent: 'untrustedRawAgent',
      clientCert: 'NULL (None presented)',
      targetResource: '/api/patients (Cloud B)',
      adversaryObjective: 'Bypass Cloud A Auth Gateway and scrape patient records directly from internal storage.'
    }
  },
  {
    id: 'SPOOFED_CA',
    name: 'Rogue CA / Spoofed Certificate',
    badge: 'Layer 5 / PKI',
    threatCategory: 'Identity Spoofing & Fake Root CA',
    shortDesc: 'Presents cert claiming CN: cloud-a-auth signed by Untrusted CA',
    targetOptions: [
      { id: 'CloudB', label: 'Cloud B (GCP EHR - Port 5002)' }
    ],
    payloadPreview: {
      claimedIdentity: 'CN: cloud-a-auth, O: Spoofed-CloudA',
      signingAuthority: 'Rogue-UntrustedCA (Adversary Private CA)',
      targetResource: '/api/patients (Cloud B)',
      adversaryObjective: 'Impersonate Cloud A identity by forging an X.509 certificate with an unauthorized Root of Trust.'
    }
  },
  {
    id: 'LATERAL_MOVEMENT',
    name: 'Cross-Cloud Lateral Movement',
    badge: 'Layer 7 / ABAC',
    threatCategory: 'Lateral Network Traversal',
    shortDesc: 'Azure Cloud C compromises and attempts to pivot into GCP Cloud B',
    targetOptions: [
      { id: 'CloudB', label: 'Cloud B (GCP EHR - Port 5002)' }
    ],
    payloadPreview: {
      sourceNode: 'Cloud C (Azure Appointments Service - Port 5003)',
      presentedCert: 'CN: localhost, O: CloudC-Azure (Valid Root CA Signature)',
      targetResource: '/api/patients (Clinical EHR domain)',
      adversaryObjective: 'Adversary breaches Azure container and attempts to pivot laterally to steal confidential clinical medical records.'
    }
  },
  {
    id: 'JWT_TAMPERING',
    name: 'MITM JWT Signature Tampering',
    badge: 'Layer 7 / Tokens',
    threatCategory: 'Privilege Escalation & Token Forgery',
    shortDesc: 'Forges role: "ADMIN" inside an intercepted patient session token',
    targetOptions: [
      { id: 'CloudA', label: 'Cloud A Gateway (/api/admin/metrics - Port 5001)' }
    ],
    payloadPreview: {
      originalClaim: '{ id: "pat-1", role: "PATIENT" }',
      elevatedClaim: '{ id: "pat-1", role: "ADMIN" }',
      cryptographicSignature: 'Forged via ATTACKER_UNTRUSTED_SECRET_KEY_99999',
      targetResource: '/api/admin/metrics (Cloud A Gateway)',
      adversaryObjective: 'Elevate regular patient privileges to System Admin without authenticating.'
    }
  }
];

export default function ZeroTrustVisualizer({ healthData, refreshHealth, user, onOpenLogin }) {
  // Zero-Trust Role-Based Access Control (RBAC) Gate:
  // Audit Ledger and Inter-Service Threat Simulator are strictly restricted to Administrators
  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: '640px', margin: '2.5rem auto' }}>
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(15,23,42,0.85)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Lock size={32} />
          </div>
          <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(244,63,94,0.2)', color: '#fda4af', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            HTTP 403 • Zero-Trust RBAC Policy Enforced
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            Administrator Authorization Required
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
            In accordance with <strong>NIST SP 800-207 Zero-Trust Architecture</strong>, the 3-Cloud Inter-Service Network Mesh, Red-Team Cyber Threat Simulator, and Multi-Cloud Security Audit Trails are classified as privileged administrative resources.
          </p>
          <div style={{ background: '#090d16', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <div style={{ marginBottom: '0.25rem' }}><span style={{ color: '#64748b' }}>Current Identity:</span> <span className="code-font" style={{ color: '#38bdf8' }}>{user ? `${user.name} (${user.role})` : 'Anonymous / Unauthenticated'}</span></div>
            <div style={{ marginBottom: '0.25rem' }}><span style={{ color: '#64748b' }}>Required Role:</span> <span className="code-font" style={{ color: '#10b981' }}>SYSTEM_ADMIN</span></div>
            <div><span style={{ color: '#64748b' }}>Enforcement Layer:</span> <span style={{ color: '#f43f5e' }}>Role-Based Access Control (RBAC) & Service Isolation</span></div>
          </div>
          <button
            onClick={() => onOpenLogin ? onOpenLogin('ADMIN') : null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(99,102,241,0.35)'
            }}
          >
            <LogIn size={16} /> Sign In as Administrator
          </button>
        </div>
      </div>
    );
  }

  const [selectedVectorId, setSelectedVectorId] = useState('NO_CERT');
  const [attackTarget, setAttackTarget] = useState('CloudB');
  const [attackResult, setAttackResult] = useState(null);
  const [attacking, setAttacking] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL'); // 'ALL' or 'ALERTS_ONLY'

  const selectedVector = ATTACK_VECTORS.find((v) => v.id === selectedVectorId) || ATTACK_VECTORS[0];

  const handleSelectVector = (vectorId) => {
    setSelectedVectorId(vectorId);
    const vec = ATTACK_VECTORS.find((v) => v.id === vectorId);
    if (vec && vec.targetOptions.length > 0) {
      setAttackTarget(vec.targetOptions[0].id);
    }
    setAttackResult(null);
  };

  const runAttackSimulation = async () => {
    setAttacking(true);
    setAttackResult(null);
    try {
      const res = await axios.post('/api/system/simulate-attack', {
        attackVector: selectedVectorId,
        targetService: attackTarget
      });
      setAttackResult(res.data);
    } catch (err) {
      setAttackResult({
        success: false,
        blockedByZeroTrust: true,
        vector: selectedVectorId,
        vectorName: selectedVector.name,
        threatCategory: selectedVector.threatCategory,
        defenseLayer: selectedVector.badge,
        handshakeResult: 'Connection Terminated / Dropped by Remote Peer',
        errorDetails: err.response?.data || err.message,
        nistPrinciple: 'NIST SP 800-207: Never Trust, Always Verify. Connection dropped cleanly at boundary.',
        technicalExplanation: `The remote microservice rejected the connection immediately: ${err.message}`
      });
    } finally {
      setAttacking(false);
      refreshHealth();
    }
  };

  const filteredLogs = (healthData?.auditLogs || []).filter((log) => {
    if (auditFilter === 'ALERTS_ONLY') {
      return log.action?.includes('SECURITY_ALERT') || log.action?.includes('BLOCKED') || log.clientCN?.includes('ATTACKER') || log.clientCN?.includes('ROGUE');
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 3-Cloud Topology & Live Mesh Status */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ display: 'inline-flex', padding: '0.3rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                <ShieldCheck size={22} />
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                3-Cloud Zero-Trust Mesh & Mutual TLS Topology
              </h2>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Cryptographic X.509 mTLS enforcement across isolated cloud microservices (AWS Identity Gateway, GCP Clinical EHR, Azure Appointments & Audit Ledger).
            </p>
          </div>
          <button
            onClick={refreshHealth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} /> Refresh Mesh Telemetry
          </button>
        </div>

        {/* 3-Cloud Visual Node Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {/* Cloud A (AWS) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.35rem', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ☁️ CLOUD A (AWS)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', fontWeight: '700' }}>
                Port 5001
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
              Identity & Auth Gateway
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Issues User JWTs & Outbound mTLS Proxy
            </p>
            <div style={{ fontSize: '0.75rem', background: '#090d16', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><span style={{ color: '#94a3b8' }}>Client Cert CN:</span> <span className="code-font" style={{ color: '#38bdf8', fontWeight: '600' }}>cloud-a-auth</span></div>
              <div><span style={{ color: '#94a3b8' }}>Root CA:</span> <span className="code-font" style={{ color: '#34d399' }}>ZeroTrust-RootCA</span></div>
              <div><span style={{ color: '#94a3b8' }}>mTLS Role:</span> <span style={{ color: '#818cf8', fontWeight: '600' }}>Client Initiator (Outbound)</span></div>
            </div>
          </div>

          {/* Cloud B (GCP) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.35rem', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ☁️ CLOUD B (GCP)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(6,182,212,0.2)', color: '#a5f3fc', fontWeight: '700' }}>
                Port 5002
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
              Patient & Clinical EHR
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Electronic Health Records, Vitals & Prescriptions
            </p>
            <div style={{ fontSize: '0.75rem', background: '#090d16', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><span style={{ color: '#94a3b8' }}>mTLS Server:</span> <span style={{ color: '#10b981', fontWeight: '700' }}>ENFORCED (Strict)</span></div>
              <div><span style={{ color: '#94a3b8' }}>rejectUnauthorized:</span> <span className="code-font" style={{ color: '#38bdf8' }}>true (CA verified)</span></div>
              <div><span style={{ color: '#94a3b8' }}>Microsegmentation:</span> <span style={{ color: '#22d3ee', fontWeight: '600' }}>CloudA-AWS Entitled Only</span></div>
            </div>
          </div>

          {/* Cloud C (Azure) */}
          <div className="glass-card glass-card-hover" style={{ padding: '1.35rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ☁️ CLOUD C (AZURE)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontWeight: '700' }}>
                Port 5003
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
              Appointments & Audit Ledger
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Clinical Schedules & Immutable Audit Logs
            </p>
            <div style={{ fontSize: '0.75rem', background: '#090d16', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><span style={{ color: '#94a3b8' }}>mTLS Server:</span> <span style={{ color: '#10b981', fontWeight: '700' }}>ENFORCED (Strict)</span></div>
              <div><span style={{ color: '#94a3b8' }}>Audit Trail:</span> <span style={{ color: '#34d399', fontWeight: '600' }}>Real-time Ledger Active</span></div>
              <div><span style={{ color: '#94a3b8' }}>Total Audit Entries:</span> <span className="code-font" style={{ color: '#f8fafc', fontWeight: '700' }}>{healthData?.auditLogs?.length || 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚔️ RED-TEAM vs BLUE-TEAM CYBER THREAT SIMULATION LAB                     */}
      {/* ========================================================================= */}
      <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid rgba(244,63,94,0.35)' }}>
        {/* Lab Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.6rem', background: 'rgba(244,63,94,0.2)', color: '#fb7185' }}>
              <Flame size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  Red-Team vs. Blue-Team Threat Simulation Lab
                </h3>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(244,63,94,0.2)', color: '#fda4af', fontWeight: '700', textTransform: 'uppercase' }}>
                  Interactive Exploit Suite
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
                Demonstrate NIST SP 800-207 Zero-Trust defenses against multi-vector network, cryptographic, and application attacks.
              </p>
            </div>
          </div>
        </div>

        {/* Attack Vector Selection Grid (4 Vectors) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {ATTACK_VECTORS.map((vector) => {
            const isSelected = selectedVectorId === vector.id;
            return (
              <div
                key={vector.id}
                onClick={() => handleSelectVector(vector.id)}
                style={{
                  padding: '1rem',
                  borderRadius: '0.65rem',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(244,63,94,0.15)' : 'rgba(15,23,42,0.6)',
                  border: `1.5px solid ${isSelected ? '#f43f5e' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected ? '0 0 20px rgba(244,63,94,0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isSelected ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#fda4af' : '#94a3b8' }}>
                    {vector.badge}
                  </span>
                  {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />}
                </div>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: '700', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                  {vector.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.35 }}>
                  {vector.shortDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Split Screen: Red-Team Attack Configuration (Left) & Blue-Team Defense Telemetry (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Red Team Configuration */}
          <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Bug size={18} style={{ color: '#fb7185' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Red Team Attack Payload Injector
              </h4>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Threat Vector:
              </label>
              <div style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: '700' }}>
                {selectedVector.name} ({selectedVector.threatCategory})
              </div>
            </div>

            {selectedVector.targetOptions.length > 1 ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Target Microservice:
                </label>
                <select
                  value={attackTarget}
                  onChange={(e) => setAttackTarget(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '0.375rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f8fafc',
                    fontSize: '0.85rem'
                  }}
                >
                  {selectedVector.targetOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Target Microservice:
                </label>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {selectedVector.targetOptions[0]?.label}
                </div>
              </div>
            )}

            {/* Live Payload Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Attacker Wire Payload Inspection:
              </label>
              <div
                className="code-font"
                style={{
                  fontSize: '0.75rem',
                  background: '#04070d',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#fda4af',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.45
                }}
              >
                {JSON.stringify(selectedVector.payloadPreview, null, 2)}
              </div>
            </div>

            {/* Launch Attack Button */}
            <button
              onClick={runAttackSimulation}
              disabled={attacking}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: attacking ? 'not-allowed' : 'pointer',
                opacity: attacking ? 0.75 : 1,
                boxShadow: '0 4px 15px rgba(225,29,72,0.4)',
                transition: 'all 0.2s',
                marginTop: 'auto'
              }}
            >
              {attacking ? <RefreshCw className="animate-spin" size={18} /> : <Flame size={18} />}
              {attacking ? 'Injecting Attack Vector...' : `🔥 Launch ${selectedVector.name}`}
            </button>
          </div>

          {/* Blue Team Defense Response */}
          <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Blue Team Zero-Trust Policy Enforcement
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: attackResult ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)', color: attackResult ? '#34d399' : '#94a3b8', fontWeight: '700' }}>
                {attackResult ? 'THREAT EVALUATED' : 'SOC STANDBY'}
              </span>
            </div>

            {attackResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Result Status Banner */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: attackResult.blockedByZeroTrust ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                    border: `1.5px solid ${attackResult.blockedByZeroTrust ? '#10b981' : '#f43f5e'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  {attackResult.blockedByZeroTrust ? (
                    <ShieldCheck size={24} style={{ color: '#10b981', flexShrink: 0 }} />
                  ) : (
                    <ShieldAlert size={24} style={{ color: '#f43f5e', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: attackResult.blockedByZeroTrust ? '#34d399' : '#fb7185' }}>
                      {attackResult.blockedByZeroTrust
                        ? '🛡️ ZERO-TRUST ENFORCED: THREAT NEUTRALIZED'
                        : '⚠️ ALERT: EXPLOIT SUCCEEDED'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {attackResult.handshakeResult || attackResult.authorizationResult || 'Request Dropped'}
                    </div>
                  </div>
                </div>

                {/* Key Zero-Trust Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: '#0f172a', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Defense Layer</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8' }}>{attackResult.defenseLayer}</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Threat Category</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b' }}>{attackResult.threatCategory}</div>
                  </div>
                </div>

                {/* Technical Post-Mortem */}
                <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={14} style={{ color: '#06b6d4' }} />
                    Zero-Trust Cryptographic Mechanism:
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                    {attackResult.technicalExplanation}
                  </p>
                </div>

                {/* NIST SP 800-207 Standard */}
                <div style={{ background: 'rgba(99,102,241,0.08)', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    📜 NIST SP 800-207 Standard Tenet
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.35, fontStyle: 'italic' }}>
                    "{attackResult.nistPrinciple}"
                  </p>
                </div>

                {/* Raw Wire / Error Payload Inspector */}
                {attackResult.errorDetails && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Raw Wire Diagnostics / Error Code:</div>
                    <div className="code-font" style={{ fontSize: '0.72rem', background: '#04070d', padding: '0.5rem', borderRadius: '0.25rem', color: '#f43f5e', overflowX: 'auto' }}>
                      {typeof attackResult.errorDetails === 'object'
                        ? JSON.stringify(attackResult.errorDetails, null, 2)
                        : attackResult.errorDetails}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', color: '#64748b', textAlign: 'center' }}>
                <Shield size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  No Active Cyber Threat Detected
                </div>
                <div style={{ fontSize: '0.8rem', maxWidth: '320px', lineHeight: 1.4 }}>
                  Select an attack vector on the left and click <strong style={{ color: '#fda4af' }}>"Launch Attack"</strong> to trigger real-time Red Team exploitation against the multi-cloud mesh.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📜 REAL-TIME ZERO-TRUST AUDIT STREAM (CLOUD C LEDGER)                      */}
      {/* ========================================================================= */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Terminal style={{ color: '#38bdf8' }} size={22} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Multi-Cloud Security Audit Stream (Azure Cloud C)
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Immutable, append-only log trail capturing every mTLS handshake, authorization event, and blocked attack.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setAuditFilter('ALL')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                background: auditFilter === 'ALL' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${auditFilter === 'ALL' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: auditFilter === 'ALL' ? '#38bdf8' : '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              All Events ({healthData?.auditLogs?.length || 0})
            </button>
            <button
              onClick={() => setAuditFilter('ALERTS_ONLY')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.375rem',
                background: auditFilter === 'ALERTS_ONLY' ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${auditFilter === 'ALERTS_ONLY' ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                color: auditFilter === 'ALERTS_ONLY' ? '#fb7185' : '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <AlertTriangle size={12} /> Security Incidents Only
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', background: '#090d16', padding: '1rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isAlert = log.action?.includes('SECURITY_ALERT') || log.action?.includes('BLOCKED') || log.clientCN?.includes('ATTACKER') || log.clientCN?.includes('ROGUE');
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '0.6rem 0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.8rem',
                    background: isAlert ? 'rgba(244,63,94,0.06)' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  <span className="code-font" style={{ color: '#64748b', minWidth: '130px', fontSize: '0.75rem', flexShrink: 0 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  <span
                    className="code-font"
                    style={{
                      color: isAlert ? '#fda4af' : '#38bdf8',
                      fontWeight: '600',
                      minWidth: '140px',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}
                  >
                    [{log.clientCN}]
                  </span>

                  <span
                    style={{
                      color: isAlert ? '#f43f5e' : '#34d399',
                      fontWeight: '700',
                      minWidth: '180px',
                      fontSize: '0.75rem',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {isAlert && <AlertTriangle size={12} />}
                    {log.action}
                  </span>

                  <span style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {log.details}
                  </span>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0', textAlign: 'center' }}>
              No audit records match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
