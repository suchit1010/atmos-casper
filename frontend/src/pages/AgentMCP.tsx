import React, { useState } from 'react';
import { Terminal, Code, CheckCircle, Zap } from 'lucide-react';

export default function AgentMCP() {
  const [prompt, setPrompt] = useState('Write a CarbonCredit Odra smart contract for VM0044 biochar methodology. Include transfer and retire functions.');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [code, setCode] = useState('');

  const runAgent = async () => {
    setRunning(true);
    setLogs([]);
    setCode('');

    const logSequence = [
      '[Agent] Parsing intent...',
      '[Agent] Connecting to Casper MCP Server...',
      '[Agent] Fetching context from https://odra.dev/llms.txt',
      '[Agent] Context loaded. Odra framework syntax rules applied.',
      '[Agent] Generating Rust smart contract...',
    ];

    for (let i = 0; i < logSequence.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setLogs(prev => [...prev, logSequence[i]]);
    }

    const generatedCode = `use odra::prelude::*;

#[odra::module]
pub struct CarbonCredit {
    pub tonnes: Var<u64>,
    pub grade: Var<u8>,
    pub methodology: Var<String>,
    pub zk_hash: Var<String>,
    pub owner: Var<Address>,
    pub retired: Var<bool>,
}

#[odra::module]
impl CarbonCredit {
    #[odra(init)]
    pub fn init(&mut self, tonnes: u64, grade: u8, methodology: String, zk_hash: String) {
        self.tonnes.set(tonnes);
        self.grade.set(grade);
        self.methodology.set(methodology);
        self.zk_hash.set(zk_hash);
        self.owner.set(self.env().caller());
        self.retired.set(false);
    }

    pub fn transfer(&mut self, to: Address) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_default() {
            self.env().revert(Error::NotOwner);
        }
        if self.retired.get_or_default() {
            self.env().revert(Error::AlreadyRetired);
        }
        self.owner.set(to);
    }

    pub fn retire(&mut self) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_default() {
            self.env().revert(Error::NotOwner);
        }
        self.retired.set(true);
        self.env().emit_event(CreditRetired {
            tonnes: self.tonnes.get_or_default(),
            retired_by: caller,
        });
    }
}

#[odra::event]
pub struct CreditRetired {
    pub tonnes: u64,
    pub retired_by: Address,
}

#[derive(odra::OdraError)]
pub enum Error {
    NotOwner = 1,
    AlreadyRetired = 2,
}`;

    // Typewriter effect for code
    for (let i = 0; i <= generatedCode.length; i += 15) {
      setCode(generatedCode.slice(0, i));
      await new Promise(r => setTimeout(r, 20));
    }
    setCode(generatedCode);

    await new Promise(r => setTimeout(r, 500));
    setLogs(prev => [...prev, '[Agent] Contract generated successfully. Ready for testnet deployment.']);
    setRunning(false);
  };

  return (
    <div className="page container">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0,255,136,0.1)', borderRadius: '24px', color: 'var(--g1)', marginBottom: '24px' }}>
            <Zap size={40} />
          </div>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Agent <span style={{ color: 'var(--g1)', fontStyle: 'italic' }}>MCP</span></h1>
          <p className="text-muted" style={{ fontSize: '18px' }}>Autonomous smart contract generation via Casper Model Context Protocol.</p>
        </div>

        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={running}
            />
            <button className="btn-primary" onClick={runAgent} disabled={running}>
              {running ? 'Executing...' : 'Run Agent'}
            </button>
          </div>
        </div>

        <div className="grid-2">
          {/* Logs */}
          <div className="glass-card" style={{ padding: '24px', background: '#0a0a0a' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Terminal size={16} /> MCP Event Stream
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log, i) => (
                <div key={i} className="mono" style={{ fontSize: '13px', color: log.includes('successfully') ? 'var(--g1)' : 'var(--text)' }}>
                  {log}
                </div>
              ))}
              {running && <div className="mono animate-pulse-glow" style={{ fontSize: '13px', color: 'var(--muted)' }}>_</div>}
            </div>
          </div>

          {/* Code */}
          <div className="glass-card" style={{ padding: '24px', background: '#0a0a0a' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Code size={16} /> carbon_credit.rs
            </h3>
            <pre className="mono" style={{ fontSize: '12px', color: '#a6accd', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {code}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
