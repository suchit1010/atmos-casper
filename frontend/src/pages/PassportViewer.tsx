import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Box, FileText, Satellite, Activity, TreePine } from 'lucide-react';

export default function PassportViewer() {
  const { id } = useParams();
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/passport/${id}`)
      .then(res => res.json())
      .then(data => {
        setPassport(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) {
    return <div className="page container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}><div className="eyebrow animate-pulse-glow">Loading Passport...</div></div>;
  }

  if (!passport || passport.error) {
    return <div className="page container" style={{ textAlign: 'center', paddingTop: '20vh' }}><h2>Passport Not Found</h2><Link to="/explorer" className="btn-outline" style={{ marginTop: '24px' }}>Back to Explorer</Link></div>;
  }

  const { atmosScore, verification, satellite } = passport;

  return (
    <div className="page container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="badge badge-mono badge-green"><Shield size={12}/> VERIFIED</div>
            <div className="badge badge-mono badge-gold"><Box size={12}/> CASPER TESTNET</div>
          </div>
          <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>{passport.projectName}</h1>
          <div className="mono text-muted" style={{ fontSize: '13px', display: 'flex', gap: '24px' }}>
            <span>ID: {passport.passportId}</span>
            <span>Type: {passport.entityType.toUpperCase()}</span>
            <span>Vintage: {verification.vintageYear}</span>
          </div>
        </div>
        
        {/* The Score */}
        <div className="glass-card" style={{ padding: '24px 32px', textAlign: 'center', minWidth: '200px' }}>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>Atmos Score™</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', fontWeight: '600', color: 'var(--g1)', lineHeight: '1' }}>{atmosScore.score}</span>
            <span style={{ fontSize: '24px', color: 'var(--muted)' }}>/100</span>
          </div>
          <div className="badge badge-green" style={{ marginTop: '12px' }}>Grade {atmosScore.grade}</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '40px' }}>
        
        {/* Verification Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--g1)' }}>
            <Activity size={20} />
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px' }}>Carbon Asset</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Estimated Impact</div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                {verification.co2eEstimated.toLocaleString()} <span style={{ fontSize: '16px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>tCO₂e</span>
              </div>
            </div>
            
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Methodology</div>
              <div className="mono" style={{ fontSize: '14px' }}>{verification.methodology}</div>
            </div>

            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>AI Fraud Risk</div>
              <div className="badge badge-mono badge-green">{atmosScore.riskLevel.toUpperCase()} RISK</div>
            </div>
          </div>
        </div>

        {/* Satellite Evidence */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--g1)' }}>
            <Satellite size={20} />
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px' }}>Satellite Evidence</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>NDVI Current</div>
              <div className="mono" style={{ fontSize: '16px' }}>{satellite.ndviCurrent.toFixed(4)}</div>
            </div>
            
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Land Use</div>
              <div className="mono" style={{ fontSize: '14px', textTransform: 'capitalize' }}>{satellite.landUse.replace('_', ' ')}</div>
            </div>

            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Fire Detection (30 Days)</div>
              {satellite.fireDetected ? (
                <div className="badge badge-mono badge-red">FIRE DETECTED</div>
              ) : (
                <div className="badge badge-mono badge-green">CLEAR</div>
              )}
            </div>
          </div>
        </div>

        {/* Blockchain Anchor */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--g1)' }}>
            <Box size={20} />
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px' }}>Casper Anchor</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Deploy Hash</div>
              <div className="mono text-muted" style={{ fontSize: '12px', wordBreak: 'break-all', background: 'var(--lift)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {passport.casperDeployHash}
              </div>
            </div>
            
            <div>
              <div className="eyebrow text-muted" style={{ marginBottom: '4px' }}>Zero-Knowledge Proof</div>
              <div className="mono text-muted" style={{ fontSize: '12px', wordBreak: 'break-all', background: 'var(--lift)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {passport.zkProofHash}
              </div>
            </div>

            {passport.casperDeployHash.endsWith('-demo-mock') ? (
              <div style={{ textAlign: 'center', background: 'var(--red-dim)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 88, 88, 0.2)', color: 'var(--red)', fontSize: '12px' }}>
                <strong>Simulation Mode Active</strong><br/>
                Configure ATMOS_CONTRACT_HASH in backend/.env to deploy to Casper Testnet.
              </div>
            ) : (
              <a href={passport.casperExplorerUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ display: 'block', textAlign: 'center', padding: '10px' }}>
                View on cspr.live
              </a>
            )}
          </div>
        </div>

      </div>

      {/* AI Cross-Verification Reasoning */}
      {verification.analysisSummary && (
        <div className="glass-card" style={{ marginBottom: '40px', borderLeft: '4px solid var(--g1)' }}>
          <h3 className="h-serif" style={{ fontSize: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} color="var(--g1)" /> AI Cross-Verification Analysis
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
            {verification.analysisSummary}
          </p>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="glass-card" style={{ marginBottom: '40px' }}>
        <h3 className="h-serif" style={{ fontSize: '28px', marginBottom: '24px' }}>Atmos Score Dimensions</h3>
        <div className="grid-4">
          {Object.entries(atmosScore.dimensions).map(([key, value]) => (
            <div key={key} style={{ background: 'var(--lift)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="eyebrow text-muted" style={{ marginBottom: '8px', letterSpacing: '1px', fontSize: '9px' }}>
                {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mono" style={{ fontSize: '24px', color: (value as number) >= 80 ? 'var(--g1)' : (value as number) >= 50 ? 'var(--gold)' : 'var(--red)' }}>
                  {value as number}
                </span>
                <div style={{ flex: 1, height: '4px', background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: (value as number) >= 80 ? 'var(--g1)' : (value as number) >= 50 ? 'var(--gold)' : 'var(--red)', width: `${value}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
