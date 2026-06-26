import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Leaf, Box, ShieldCheck, Search } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AIAnalyst from './pages/AIAnalyst';
import PassportViewer from './pages/PassportViewer';
import Explorer from './pages/Explorer';
import AgentMCP from './pages/AgentMCP';

function App() {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--g1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={20} color="var(--ink)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '600', color: 'var(--g1)', letterSpacing: '1px' }}>
              ATMOS
            </div>
            <div className="eyebrow" style={{ fontSize: '9px', marginTop: '-2px' }}>
              PROTOCOL
            </div>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/analyst" className={`nav-link ${location.pathname === '/analyst' ? 'active' : ''}`}>AI Analyst</Link>
          <Link to="/explorer" className={`nav-link ${location.pathname === '/explorer' ? 'active' : ''}`}>Explorer</Link>
          <Link to="/agent-mcp" className={`nav-link ${location.pathname === '/agent-mcp' ? 'active' : ''}`}>Agent MCP</Link>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="badge badge-mono badge-green">
            <Box size={12} /> Casper Testnet
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyst" element={<AIAnalyst />} />
          <Route path="/passport/:id" element={<PassportViewer />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/agent-mcp" element={<AgentMCP />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
