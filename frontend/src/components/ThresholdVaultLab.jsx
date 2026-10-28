import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Cloud,
  Server,
  Zap,
  Flame,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import axios from 'axios';

export default function ThresholdVaultLab({ user, token }) {
  // Vault state
  const [loading, setLoading] = useState(false);
  const [vaultStatus, setVaultStatus] = useState(null);
  const [initResult, setInitResult] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Stage 2: Breach Simulator state
  const [breachCloud, setBreachCloud] = useState('CloudB');
  const [breachResult, setBreachResult] = useState(null);
  const [simulatingBreach, setSimulatingBreach] = useState(false);

  // Stage 3: Quorum Reconstruction state
  const [selectedQuorum, setSelectedQuorum] = useState(['CloudA', 'CloudB']);
  const [reconstructResult, setReconstructResult] = useState(null);
  const [reconstructing, setReconstructing] = useState(false);

  // Active visualization mode: 'NORMAL' | 'BREACH' | 'RECONSTRUCTED'
  const [visualMode, setVisualMode] = useState('NORMAL');

  // Fetch initial vault status
  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/vault/status');
      setVaultStatus(res.data);
    } catch (err) {
      console.error('Error fetching vault status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Stage 1: Initialize Vault & Split Master Key
  const handleInitializeVault = async () => {
    setLoading(true);
    setError(null);
    setBreachResult(null);
    setReconstructResult(null);
    try {
      const res = await axios.post('/api/vault/initialize', {});
      setInitResult(res.data);
      setActionSuccess('Master Key generated and split across 3 clouds via Shamir (k=2, n=3)!');
      setVisualMode('NORMAL');
      fetchStatus();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Simulate Single Cloud Breach
  const handleSimulateBreach = async () => {
    setSimulatingBreach(true);
    setError(null);
    try {
      const res = await axios.post('/api/vault/simulate-breach', { targetCloud: breachCloud });
      setBreachResult(res.data);
      setVisualMode('BREACH');
      setActionSuccess(`Breach simulated on ${breachCloud}. Mathematical proof of zero information leakage displayed.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSimulatingBreach(false);
    }
  };

  // Stage 3: Multi-Cloud Quorum Reconstruction
  const handleReconstruct = async () => {
    if (selectedQuorum.length < 2) {
      alert('Please select at least 2 clouds to meet threshold k=2');
      return;
    }
    setReconstructing(true);
    setError(null);
    try {
      const res = await axios.post('/api/vault/reconstruct', { selectedClouds: selectedQuorum });
      setReconstructResult(res.data);
      setVisualMode('RECONSTRUCTED');
      setActionSuccess('Lagrange Interpolation evaluated successfully! Vault decrypted.');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setReconstructing(false);
    }
  };

  const toggleQuorumCloud = (cloudId) => {
    if (selectedQuorum.includes(cloudId)) {
      if (selectedQuorum.length > 2) {
        setSelectedQuorum(selectedQuorum.filter((c) => c !== cloudId));
      } else {
        alert('Threshold k=2 requires at least 2 clouds');
      }
    } else {
      setSelectedQuorum([...selectedQuorum, cloudId]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ display: 'inline-flex', padding: '0.35rem', borderRadius: '0.5rem', background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                <KeyRound size={22} />
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Shamir's (k=2, n=3) Threshold Secret Sharing & Multi-Cloud Vault Lab
              </h2>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', maxWidth: '850px', lineHeight: 1.5 }}>
              Eliminates the Single Point of Failure (SPOF) in multi-cloud healthcare. A 256-bit Master Key is split across 
              <strong> AWS (Cloud A)</strong>, <strong>GCP (Cloud B)</strong>, and <strong>Azure (Cloud C)</strong> over finite field 
              <span className="code-font" style={{ color: '#c4b5fd' }}> F_p</span>. Any 2 clouds can reconstruct the secret via Lagrange Interpolation; any single compromised cloud leaks 0.00% information.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontWeight: '700' }}>
              Finite Field: secp256k1 Prime
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontWeight: '700' }}>
              Threshold: k = 2 Quorum
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
      </div>

      {/* SVG Polynomial & Finite Coordinate Visualizer */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: '#8b5cf6' }} />
              Finite Field Coordinate Plane & Multi-Cloud Lagrange Geometry
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              The secret S is the y-intercept f(0). Cloud shares are evaluation points (1, y1), (2, y2), and (3, y3).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setVisualMode('NORMAL')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                border: visualMode === 'NORMAL' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: visualMode === 'NORMAL' ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: visualMode === 'NORMAL' ? '#c4b5fd' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              Standard 3-Cloud Plane
            </button>
            <button
              onClick={() => setVisualMode('BREACH')}
              disabled={!breachResult}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                border: visualMode === 'BREACH' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                background: visualMode === 'BREACH' ? 'rgba(239,68,68,0.2)' : 'transparent',
                color: visualMode === 'BREACH' ? '#fca5a5' : '#94a3b8',
                cursor: breachResult ? 'pointer' : 'not-allowed',
                opacity: breachResult ? 1 : 0.5
              }}
            >
              1-Share Breach Proof
            </button>
            <button
              onClick={() => setVisualMode('RECONSTRUCTED')}
              disabled={!reconstructResult}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                border: visualMode === 'RECONSTRUCTED' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                background: visualMode === 'RECONSTRUCTED' ? 'rgba(16,185,129,0.2)' : 'transparent',
                color: visualMode === 'RECONSTRUCTED' ? '#34d399' : '#94a3b8',
                cursor: reconstructResult ? 'pointer' : 'not-allowed',
                opacity: reconstructResult ? 1 : 0.5
              }}
            >
              Lagrange Quorum Path
            </button>
          </div>
        </div>

        {/* Dynamic SVG Graph */}
        <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
          <svg viewBox="0 0 760 260" style={{ width: '100%', height: '240px', overflow: 'visible' }}>
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="760" height="260" fill="url(#grid)" />

            {/* Axes */}
            <line x1="80" y1="210" x2="720" y2="210" stroke="#334155" strokeWidth="2" />
            <line x1="120" y1="30" x2="120" y2="230" stroke="#334155" strokeWidth="2" />

            {/* Axis Labels */}
            <text x="730" y="215" fill="#64748b" fontSize="12" fontFamily="JetBrains Mono">x (Cloud)</text>
            <text x="100" y="25" fill="#64748b" fontSize="12" fontFamily="JetBrains Mono">f(x) in F_p</text>

            {/* X-axis tick marks */}
            <text x="115" y="230" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">x=0</text>
            <text x="270" y="230" fill="#f59e0b" fontSize="11" fontFamily="JetBrains Mono">x=1 (AWS)</text>
            <text x="450" y="230" fill="#06b6d4" fontSize="11" fontFamily="JetBrains Mono">x=2 (GCP)</text>
            <text x="630" y="230" fill="#3b82f6" fontSize="11" fontFamily="JetBrains Mono">x=3 (Azure)</text>

            {/* Grid vertical markers */}
            <line x1="120" y1="210" x2="120" y2="40" stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" />
            <line x1="280" y1="210" x2="280" y2="40" stroke="rgba(245,158,11,0.2)" strokeDasharray="3,3" />
            <line x1="460" y1="210" x2="460" y2="40" stroke="rgba(6,182,212,0.2)" strokeDasharray="3,3" />
            <line x1="640" y1="210" x2="640" y2="40" stroke="rgba(59,130,246,0.2)" strokeDasharray="3,3" />

            {/* If in Breach Mode: Plot 5 Alternative Candidate Polynomial Lines Passing through Point 2 (GCP) */}
            {visualMode === 'BREACH' && (
              <>
                <line x1="0" y1="90" x2="760" y2="135" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="0" y1="170" x2="760" y2="70" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="0" y1="50" x2="760" y2="180" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="0" y1="210" x2="760" y2="40" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="0" y1="120" x2="760" y2="120" stroke="rgba(34,197,94,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="140" y="55" fill="#fca5a5" fontSize="11" fontWeight="700">
                  Infinitely Many Lines Pass Through 1 Stolen Point ➔ 0% Key Information Leaked
                </text>
              </>
            )}

            {/* Primary Genuine Polynomial Line */}
            {visualMode !== 'BREACH' && (
              <line 
                x1="120" 
                y1="160" 
                x2="680" 
                y2="60" 
                stroke={visualMode === 'RECONSTRUCTED' ? '#10b981' : '#8b5cf6'} 
                strokeWidth={visualMode === 'RECONSTRUCTED' ? '3' : '2'} 
              />
            )}

            {/* Target Intercept: (0, S) - Master Secret */}
            <circle 
              cx="120" 
              y="160" 
              r={visualMode === 'RECONSTRUCTED' ? '8' : '6'} 
              fill={visualMode === 'RECONSTRUCTED' ? '#10b981' : '#f43f5e'} 
              stroke="#ffffff" 
              strokeWidth="2" 
            />
            <text x="60" y="155" fill={visualMode === 'RECONSTRUCTED' ? '#34d399' : '#fb7185'} fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">
              (0, S) Key
            </text>

            {/* Point 1: AWS (1, y1) */}
            <circle cx="280" y="135" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <text x="260" y="120" fill="#f59e0b" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">(1, y1)</text>

            {/* Point 2: GCP (2, y2) */}
            <circle cx="460" y="105" r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            <text x="440" y="90" fill="#06b6d4" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">(2, y2)</text>

            {/* Point 3: Azure (3, y3) */}
            <circle cx="640" y="75" r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            <text x="620" y="60" fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">(3, y3)</text>
          </svg>
        </div>
      </div>

      {/* 3 Interactive Operational Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* ========================================================================= */}
        {/* STAGE 1: KEY GENERATION & MULTI-CLOUD SPLIT (k=2, n=3)                    */}
        {/* ========================================================================= */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#c4b5fd' }}>
              1
            </span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
              Cryptographic Split & Distribution
            </h3>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Generates an ephemeral 256-bit AES Master Key <span className="code-font" style={{ color: '#c4b5fd' }}>S</span>, seals the classified ICU trauma chart, evaluates polynomial <span className="code-font">f(x)</span>, and deposits shares into AWS, GCP, and Azure over mutual TLS.
          </p>

          <button
            onClick={handleInitializeVault}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(139,92,246,0.35)'
            }}
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
            {loading ? 'Evaluating & Depositing Shares...' : '⚡ Generate 256-bit Key & Distribute Shares'}
          </button>

          {/* Shares Summary Card */}
          {initResult && (
            <div style={{ background: '#090d16', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase' }}>
                ✓ Shares Deposited Over mTLS:
              </div>
              {initResult.sharesSummary.map((s) => (
                <div key={s.x} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  <span>{s.cloud} (x={s.x}):</span>
                  <span className="code-font" style={{ color: '#c4b5fd' }}>{s.yPreview}</span>
                </div>
              ))}
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
                Master key S purged from memory. Sealed Ciphertext: {initResult.encryptedVault.ciphertextPreview}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STAGE 2: SINGLE-CLOUD BREACH SIMULATOR (SHANNON SECRECY PROOF)            */}
        {/* ========================================================================= */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#fca5a5' }}>
              2
            </span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
              Single-Cloud Breach Simulator
            </h3>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Simulate an adversary compromising 1 cloud node (e.g. root memory dump). Proves mathematically that possessing only 1 share leaks <strong>0.00% information</strong> about Master Key S.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['CloudA', 'CloudB', 'CloudC'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBreachCloud(c)}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: '0.375rem',
                  border: breachCloud === c ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  background: breachCloud === c ? 'rgba(239,68,68,0.2)' : '#090d16',
                  color: breachCloud === c ? '#fca5a5' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {c === 'CloudA' ? 'AWS' : c === 'CloudB' ? 'GCP' : 'Azure'}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimulateBreach}
            disabled={simulatingBreach}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: simulatingBreach ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(239,68,68,0.35)'
            }}
          >
            {simulatingBreach ? <RefreshCw className="animate-spin" size={16} /> : <Flame size={16} />}
            {simulatingBreach ? 'Simulating Breach...' : `💀 Compromise ${breachCloud} (1 Share)`}
          </button>

          {/* Breach Result Display */}
          {breachResult && (
            <div style={{ background: '#090d16', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f87171' }}>
                ⚠️ Adversary Exfiltrated Share (x={breachResult.compromisedShare.x}):
              </div>
              <div className="code-font" style={{ fontSize: '0.7rem', color: '#fda4af', wordBreak: 'break-all' }}>
                y = {breachResult.compromisedShare.yHex.substring(0, 32)}...
              </div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.3, marginTop: '0.2rem' }}>
                <strong>Mathematical Defense:</strong> In F_p, there exist exactly 2^256 lines through this single point. P(Key = S) = 1/2^256 (Equivalent to Brute Force).
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STAGE 3: MULTI-CLOUD QUORUM RECONSTRUCTION (LAGRANGE INTERPOLATION)       */}
        {/* ========================================================================= */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800', color: '#34d399' }}>
              3
            </span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
              Quorum Reconstruction (k=2)
            </h3>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Select any 2 participating clouds. They mutually authenticate over mTLS, exchange their shares, evaluate Lagrange basis coefficients, and unlock the sealed emergency vault.
          </p>

          {/* Quorum Selector */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'CloudA', label: 'AWS' },
              { id: 'CloudB', label: 'GCP' },
              { id: 'CloudC', label: 'Azure' }
            ].map((node) => {
              const isChecked = selectedQuorum.includes(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => toggleQuorumCloud(node.id)}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    borderRadius: '0.375rem',
                    border: isChecked ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: isChecked ? 'rgba(16,185,129,0.2)' : '#090d16',
                    color: isChecked ? '#34d399' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isChecked ? `✓ ${node.label}` : node.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleReconstruct}
            disabled={reconstructing}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: reconstructing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16,185,129,0.35)'
            }}
          >
            {reconstructing ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
            {reconstructing ? 'Evaluating Lagrange Math over mTLS...' : '🔓 Reconstruct Vault via Lagrange Quorum'}
          </button>

          {/* Reconstructed Key & Math Display */}
          {reconstructResult && (
            <div style={{ background: '#090d16', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399' }}>
                ✓ Master Secret S Reconstructed:
              </div>
              <div className="code-font" style={{ fontSize: '0.7rem', color: '#a7f3d0', wordBreak: 'break-all' }}>
                S = {reconstructResult.reconstructedKeyHex}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Quorum: [{reconstructResult.quorumClouds.join(' + ')}]
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNLOCKED VAULT PAYLOAD DISPLAY */}
      {reconstructResult && reconstructResult.decryptedClinicalRecord && (
        <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '4px solid #10b981', background: 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.85) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} style={{ color: '#10b981' }} />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase' }}>
                  VAULT UNLOCKED VIA 2-OF-3 LAGRANGE INTERPOLATION
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
                  Decrypted Classified Clinical Trauma Record: {reconstructResult.decryptedClinicalRecord.targetPatient.name}
                </h3>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
              AES-256-GCM Decryption Validated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#090d16', padding: '0.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase' }}>Critical Allergies</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: '700', marginTop: '0.2rem' }}>
                {reconstructResult.decryptedClinicalRecord.targetPatient.criticalAllergies.join(', ')}
              </div>
            </div>

            <div style={{ background: '#090d16', padding: '0.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>Blood Type & DOB</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: '700', marginTop: '0.2rem' }}>
                {reconstructResult.decryptedClinicalRecord.targetPatient.bloodType} • DOB: {reconstructResult.decryptedClinicalRecord.targetPatient.dob}
              </div>
            </div>

            <div style={{ background: '#090d16', padding: '0.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: '700', textTransform: 'uppercase' }}>Genomic Sequencing Warning</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {reconstructResult.decryptedClinicalRecord.targetPatient.genomicSequencingAlert}
              </div>
            </div>
          </div>

          <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Sealed Psychiatric Consultation Notes (HIPAA Rest-Encrypted)
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              {reconstructResult.decryptedClinicalRecord.targetPatient.sensitivePsychiatricNotes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
