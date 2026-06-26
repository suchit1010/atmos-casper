import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Satellite, MapPin, CheckCircle, Loader } from 'lucide-react';

export default function AIAnalyst() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  
  const [formData, setFormData] = useState({
    projectName: 'Rajasthan Solar Phase II',
    entityType: 'solar_energy',
    lat: 26.9124,
    lng: 75.7873,
    areaHa: 45,
    biocharYieldTonnes: 0,
    capacityKw: 1500,
    capacityFactor: 0.22
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setStep(1); // Call satellite
    await new Promise(r => setTimeout(r, 1000));
    setStep(2); // 402 Paywall hit
    await new Promise(r => setTimeout(r, 1500));
    setStep(3); // Paid
    await new Promise(r => setTimeout(r, 1000));
    setStep(4); // AI Analysis
    await new Promise(r => setTimeout(r, 2000));
    setStep(5); // Casper Anchor

    try {
      // Simulate backend API delay
      await new Promise(r => setTimeout(r, 1000));
      
      const mockProjectId = 'proj_' + Math.random().toString(36).substring(2, 9);
      
      // Store mock passport data in localStorage so PassportViewer can read it
      const mockPassport = {
        projectId: mockProjectId,
        projectName: formData.projectName,
        entityType: formData.entityType,
        atmosScore: 92,
        grade: 3, // Grade A
        co2eTonnesKg: formData.areaHa * 12500, 
        methodology: formData.entityType === 'solar_energy' ? 'ACM0002' : 'VM0044',
        vintageYear: new Date().getFullYear(),
        casperDeployHash: Array.from({length: 48}, () => Math.floor(Math.random()*16).toString(16)).join('') + '-demo-mock',
        verificationData: {
          confidenceScore: 95,
          fraudRiskScore: 2,
          fraudRisk: 'low',
          fraudSignals: ['No satellite anomalies', 'Metadata consistency high'],
          methodologyMatch: 98,
          analysisSummary: `AI cross-verification complete. Project claims align with Sentinel-2 satellite observation. No anomalies detected.`
        }
      };
      
      localStorage.setItem(\`atmos_passport_\${mockProjectId}\`, JSON.stringify(mockPassport));
      
      navigate(\`/passport/\${mockProjectId}\`);
    } catch (err) {
      console.error(err);
      alert('Network error');
      setLoading(false);
    }
  };

  return (
    <div className="page container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--soft)', borderRadius: '24px', border: '1px solid var(--border)', color: 'var(--g1)', marginBottom: '24px' }}>
            <Cpu size={40} />
          </div>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>AI <span style={{ color: 'var(--g1)', fontStyle: 'italic' }}>Analyst</span></h1>
          <p className="text-muted" style={{ fontSize: '18px' }}>Submit a project for automated MRV pipeline verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '40px' }}>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Project Name</label>
              <input className="input-field" type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} required />
            </div>
            
            <div className="input-group">
              <label className="input-label">Entity Type</label>
              <select className="input-field" value={formData.entityType} onChange={e => setFormData({...formData, entityType: e.target.value})}>
                <option value="biochar">Biochar</option>
                <option value="agroforestry">Agroforestry</option>
                <option value="solar_energy">Solar Energy</option>
                <option value="soil_carbon">Soil Carbon</option>
                <option value="ev_fleet">EV Fleet</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Latitude</label>
              <input className="input-field" type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})} required />
            </div>

            <div className="input-group">
              <label className="input-label">Longitude</label>
              <input className="input-field" type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})} required />
            </div>

            <div className="input-group">
              <label className="input-label">Area (Hectares)</label>
              <input className="input-field" type="number" step="any" value={formData.areaHa} onChange={e => setFormData({...formData, areaHa: parseFloat(e.target.value)})} required />
            </div>

            {formData.entityType === 'biochar' && (
              <div className="input-group">
                <label className="input-label">Biochar Yield (Tonnes)</label>
                <input className="input-field" type="number" step="any" value={formData.biocharYieldTonnes} onChange={e => setFormData({...formData, biocharYieldTonnes: parseFloat(e.target.value)})} />
              </div>
            )}

            {formData.entityType === 'solar_energy' && (
              <>
                <div className="input-group">
                  <label className="input-label">Capacity (kW)</label>
                  <input className="input-field" type="number" step="any" value={formData.capacityKw} onChange={e => setFormData({...formData, capacityKw: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Capacity Factor (0-1)</label>
                  <input className="input-field" type="number" step="any" value={formData.capacityFactor} onChange={e => setFormData({...formData, capacityFactor: parseFloat(e.target.value)})} />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {loading ? (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: step >= 1 ? 'var(--g1)' : 'var(--muted)', opacity: step >= 1 ? 1 : 0.5 }}>
                    {step > 1 ? <CheckCircle size={20} /> : <Loader size={20} className={step === 1 ? 'animate-pulse-glow' : ''} />}
                    <span className="mono" style={{ fontSize: '13px' }}>1. Agent: Requesting Sentinel-2 Satellite Data...</span>
                  </div>
                  
                  {step >= 2 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--red)', opacity: step >= 2 ? 1 : 0.5 }}>
                      <span className="badge badge-mono badge-red" style={{ fontSize: '10px' }}>HTTP 402</span>
                      <span className="mono" style={{ fontSize: '13px' }}>Payment Required: 0.003 CSPR (x402 Protocol)</span>
                    </div>
                  )}

                  {step >= 3 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--g1)' }}>
                      <CheckCircle size={20} />
                      <span className="mono" style={{ fontSize: '13px' }}>Agent: Paid 0.003 CSPR. Payload received.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: step >= 4 ? 'var(--g1)' : 'var(--muted)', opacity: step >= 4 ? 1 : 0.5 }}>
                    {step > 4 ? <CheckCircle size={20} /> : <Loader size={20} className={step === 4 ? 'animate-pulse-glow' : ''} />}
                    <span className="mono" style={{ fontSize: '13px' }}>2. Running AI Verification & Atmos Score...</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: step >= 5 ? 'var(--g1)' : 'var(--muted)', opacity: step >= 5 ? 1 : 0.5 }}>
                    {step > 5 ? <CheckCircle size={20} /> : <Loader size={20} className={step === 5 ? 'animate-pulse-glow' : ''} />}
                    <span className="mono" style={{ fontSize: '13px' }}>3. Anchoring Passport on Casper Blockchain...</span>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--lift)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--g1)', width: `${(step / 3) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ) : (
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Run MRV Pipeline
              </button>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}
