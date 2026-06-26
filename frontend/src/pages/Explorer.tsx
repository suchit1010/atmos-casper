import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Box } from 'lucide-react';

export default function Explorer() {
  const [passports, setPassports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for Vercel deployment without backend
    setTimeout(() => {
      const mockPassports = [
        {
          passportId: 'CASPER-8492A',
          projectId: 'demo-1',
          projectName: 'Rajasthan Solar Phase II',
          entityType: 'solar_energy',
          atmosScore: { grade: 'A', score: 92 },
          verification: { co2eEstimated: 25000 }
        },
        {
          passportId: 'CASPER-3910B',
          projectId: 'demo-2',
          projectName: 'Amazon Agroforestry Initiative',
          entityType: 'agroforestry',
          atmosScore: { grade: 'S', score: 98 },
          verification: { co2eEstimated: 145000 }
        }
      ];

      // Also grab any locally generated passports from localStorage
      const localPassports = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('atmos_passport_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '');
            localPassports.push({
              passportId: 'CASPER-' + data.projectId.substring(5).toUpperCase(),
              projectId: data.projectId,
              projectName: data.projectName,
              entityType: data.entityType,
              atmosScore: { grade: data.grade === 3 ? 'A' : 'S', score: data.atmosScore },
              verification: { co2eEstimated: data.co2eTonnesKg }
            });
          } catch(e){}
        }
      }

      setPassports([...localPassports, ...mockPassports]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="page container">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Network <span style={{ color: 'var(--g1)', fontStyle: 'italic' }}>Explorer</span></h1>
          <p className="text-muted" style={{ fontSize: '16px' }}>Explore all verified carbon passports anchored on Casper.</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            placeholder="Search Project ID or Hash..." 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '44px', marginBottom: 0 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="eyebrow animate-pulse-glow">Loading Network Data...</div>
        </div>
      ) : passports.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p className="text-muted" style={{ marginBottom: '24px' }}>No passports have been issued on the network yet.</p>
          <Link to="/analyst" className="btn-primary">Verify First Project</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {passports.map(p => (
            <Link key={p.passportId} to={`/passport/${p.projectId}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ background: 'var(--lift)', border: '1px solid var(--border)', borderRadius: '12px', width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>GRADE</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '600', color: 'var(--g1)', lineHeight: '1' }}>{p.atmosScore.grade}</div>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '4px' }}>{p.projectName}</h3>
                    <div className="mono text-muted" style={{ fontSize: '12px', display: 'flex', gap: '16px' }}>
                      <span>{p.passportId}</span>
                      <span>•</span>
                      <span>{p.verification.co2eEstimated.toLocaleString()} tCO₂e</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="badge badge-mono badge-green"><ShieldCheck size={12}/> AI VERIFIED</div>
                  <div className="badge badge-mono badge-gold"><Box size={12}/> CASPER</div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
