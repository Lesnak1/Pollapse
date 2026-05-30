'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Terminal, Compass, ShieldAlert, Cpu, Milestone } from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('features');

  const tabs = [
    { id: 'features', label: 'Product & Features', icon: <Compass size={16} /> },
    { id: 'how-it-works', label: 'How It Works', icon: <Cpu size={16} /> },
    { id: 'roadmap', label: 'Protocol Roadmap', icon: <Milestone size={16} /> },
    { id: 'api', label: 'API Reference', icon: <Terminal size={16} /> },
  ];

  return (
    <div className="container page-content animate-fade-in">
      {/* Back Link */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 40 }}>
        <div>
          <span className="badge badge-blue">
            <BookOpen size={12} style={{ marginRight: 4 }} /> USER DOCUMENTATION
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Pollapse <span className="highlight" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Knowledge Hub</span>
          </h1>
          <p className="section-subtitle">
            Deep dive into the cross-market intelligence algorithms, roadmap milestones, and developer API references.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 32,
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`navbar-link ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: activeTab === tab.id ? 'var(--bg-layer-2)' : 'transparent',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="stagger">
        {activeTab === 'features' && (
          <div className="card" style={{ padding: 40, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              Product Specifications & Features
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
              Pollapse is the premier cross-market intelligence layer built for Polymarket. Unlike generic trading terminals, Pollapse uncovers statistical anomalies, correlation pathways, and composite sentiments that are invisible to the naked eye.
            </p>

            <div className="grid grid-2" style={{ gap: 24 }}>
              <div style={{ padding: 20, background: 'var(--bg-layer-3)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>🔗</span> Interactive Correlation Web
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  A hardware-accelerated, force-directed network graph mapping the Pearson correlation coefficient between active markets. It enables traders to spot systemic directional networks and cluster-related exposures instantly.
                </p>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-layer-3)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>📊</span> Sector Indices
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Bloomberg-style composite probability indexes tracking macro domains (US Politics, Crypto, Tech, Sports, etc.). Logarithmic volume weighting ensures high-volume outliers do not wash out subtle predictive signals.
                </p>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-layer-3)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span> Divergence Arbitrage Scanner
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Real-time scanner tracking price anomalies between highly correlated legs. When positively correlated markets drift apart, it generates statistical convergence arbitrage strategies (Buy underpriced Yes / Buy overpriced No).
                </p>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-layer-3)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>🧠</span> Multi-Market Thesis Builder
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Portfolio modeler mapping multi-legged macro bets. Features cross-market concentration checks to warn if you are betting in duplicate directions on highly dependent markets, preserving capital efficiency.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'how-it-works' && (
          <div className="card" style={{ padding: 40, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              Mathematical Methodology
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
              Pollapse processes thousands of price history tuples directly from Polymarket CLOB endpoints serverless.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ padding: 24, background: 'var(--bg-layer-3)', borderRadius: 12, borderLeft: '4px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  1. Pearson Correlation Alignment
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  For any market pair X and Y, we fetch daily historical midpoint pricing vectors, align them chronologically, and calculate the Pearson correlation coefficient (r):
                  <br /><br />
                  <code style={{ display: 'block', padding: 12, background: '#06070a', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center' }}>
                    r = [ Sum((Xi - X_avg) * (Yi - Y_avg)) ] / Sqrt[ Sum(Xi - X_avg)² * Sum(Yi - Y_avg)² ]
                  </code>
                  <br />
                  Values near +1 indicate strong direct movement, near -1 indicate inverse dependency, and near 0 represent statistical independence.
                </p>
              </div>

              <div style={{ padding: 24, background: 'var(--bg-layer-3)', borderRadius: 12, borderLeft: '4px solid var(--warning)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  2. Logarithmic Volume Weighting (Sector Indices)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  Standard averages allow extreme outlier events (e.g. US Presidential election) to completely wash out other constituent events. Pollapse implements Logarithmic Volume Weighting:
                  <br /><br />
                  <code style={{ display: 'block', padding: 12, background: '#06070a', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center' }}>
                    Weight_i = log10(Volume_USD_i + 1) + 1
                  </code>
                  <br />
                  Composite probability score is calculated as:
                  <br /><br />
                  <code style={{ display: 'block', padding: 12, background: '#06070a', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center' }}>
                    Sector Sentiment Index = Sum(Price_i * Weight_i) / Sum(Weight_i)
                  </code>
                  <br />
                  This guarantees robust, well-distributed tracking of general category sentiments.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="card" style={{ padding: 40, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
              Protocol Milestones & Roadmap
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', paddingLeft: 24 }}>
              {/* Timeline border */}
              <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: 'var(--border-color)' }}></div>

              {/* Phase 1 */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }}></div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Phase 1: Intelligence Web & CLOB Routing (Current - V1.0)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Launch of Pearson correlation calculation servers, interactive D3.js physics clusters, logarithmic volume indices, and direct routing deep-links mapping transaction codes on Polymarket CLOB.
                </p>
              </div>

              {/* Phase 2 */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }}></div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Phase 2: On-Chain Direct Wallet Settlement (Upcoming)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Integration of web3 providers (Metamask, Coinbase Wallet, WalletConnect). Direct routing of limit and market orders through our native portal, collecting fees (0.5%-1.0%) to support protocol growth.
                </p>
              </div>

              {/* Phase 3 */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Phase 3: AI-Powered Auto-Thesis Execution & Agents (Future)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Deploying autonomous AI agents that analyze real-world feeds, build macro theses dynamically, and execute convergent delta-neutral trades instantly using on-chain smart contracts.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="card" style={{ padding: 40, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              Developer API Documentation
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
              Other builders can build on top of Pollapse's correlation calculations. We expose public, rate-limited JSON proxy endpoints.
            </p>

            {/* Code Block 1 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0', borderBottom: 'none', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>GET /api/correlations</span>
                <span style={{ color: 'var(--text-muted)' }}>Fetch live correlation webs</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 20,
                  background: '#06070a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0 0 8px 8px',
                  overflowX: 'auto',
                  fontSize: '0.8rem',
                  color: '#a78bfa',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5,
                }}
              >
{`{
  "pairs": [
    {
      "marketA": "0x00f...1a4",
      "marketB": "0x01a...23c",
      "correlation": 0.87,
      "marketATitle": "Will Bitcoin reach $100k in 2026?",
      "marketBTitle": "Will Ethereum reach $10k in 2026?"
    }
  ],
  "stats": {
    "marketsAnalyzed": 48,
    "strongCorrelations": 12,
    "divergenceCount": 3
  }
}`}
              </pre>
            </div>

            {/* Code Block 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0', borderBottom: 'none', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>GET /api/sectors</span>
                <span style={{ color: 'var(--text-muted)' }}>Fetch sector composite values</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 20,
                  background: '#06070a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0 0 8px 8px',
                  overflowX: 'auto',
                  fontSize: '0.8rem',
                  color: '#a78bfa',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5,
                }}
              >
{`{
  "sectors": {
    "politics": {
      "name": "Politics",
      "index": 0.54,
      "marketCount": 18,
      "totalVolume": 12450000
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
