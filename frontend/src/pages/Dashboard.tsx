import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Globe, Leaf, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPassports: 0, totalCo2eKg: 0, totalRetired: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div className="page container">
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px', marginTop: '40px' }}>
        <div className="eyebrow animate-pulse-glow" style={{ display: 'inline-block', marginBottom: '24px', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--soft)' }}>
          Powered by Casper Network
        </div>
        <h1 className="stagger-1" style={{ fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: '1.1', marginBottom: '24px' }}>
          The Trust Layer for<br/>
          <span style={{ color: 'var(--g1)', fontStyle: 'italic' }}>Carbon Assets</span>
        </h1>
        <p className="stagger-2 text-muted" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', marginBottom: '40px' }}>
          Atmos creates a verifiable digital passport for every climate project. Backed by satellite evidence, AI verification, and zero-knowledge proofs.
        </p>
        
        <div className="stagger-3" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/analyst" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">
              Verify a Project <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/explorer" style={{ textDecoration: 'none' }}>
            <button className="btn-outline">
              Explore Passports
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-3 stagger-4" style={{ marginBottom: '80px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="eyebrow text-muted" style={{ marginBottom: '12px' }}>Verified Passports</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', color: 'var(--g1)', fontWeight: '600', lineHeight: '1' }}>
            {stats.totalPassports || '0'}
          </div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="eyebrow text-muted" style={{ marginBottom: '12px' }}>Verified CO2e (Tonnes)</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', color: 'var(--g1)', fontWeight: '600', lineHeight: '1' }}>
            {((stats.totalCo2eKg || 0) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="eyebrow text-muted" style={{ marginBottom: '12px' }}>Permanently Retired</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', color: 'var(--g1)', fontWeight: '600', lineHeight: '1' }}>
            {stats.totalRetired || '0'}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid-3">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '12px', background: 'var(--soft)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--g1)' }}>
            <Activity size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>AI MRV Engine</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>Automated carbon estimation across 11 methodologies with multi-signal fraud detection.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '12px', background: 'var(--soft)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--g1)' }}>
            <Globe size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>Satellite Evidence</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>Integration with Sentinel-2 STAC and NASA FIRMS for immutable physical evidence.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '12px', background: 'var(--soft)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--g1)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>Casper Trust Layer</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>Every verification anchored on the Casper blockchain as a verifiable digital passport.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
