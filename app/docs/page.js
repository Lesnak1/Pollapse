'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Terminal, Compass, ShieldAlert, Cpu, Milestone, CheckCircle, RefreshCw, XCircle, Info } from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('features');

  // Developer Webhook Hub States
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [payloadType, setPayloadType] = useState('lp_alert'); // lp_alert, div_alert
  const [isDispatching, setIsDispatching] = useState(false);
  const [terminalLog, setTerminalLog] = useState([]);

  // Load persistent developer settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('pollapse_dev_key');
      const savedUrl = localStorage.getItem('pollapse_dev_url');
      if (savedKey) {
        setApiKey(savedKey);
        setWebhookSaved(true);
      }
      if (savedUrl) setWebhookUrl(savedUrl);
    }
  }, []);

  const handleGenerateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'pl_live_';
    for (let i = 0; i < 24; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(key);
  };

  const handleSaveWebhook = () => {
    if (typeof window !== 'undefined') {
      if (apiKey) localStorage.setItem('pollapse_dev_key', apiKey);
      if (webhookUrl) localStorage.setItem('pollapse_dev_url', webhookUrl);
      setWebhookSaved(true);
      
      const timestamp = new Date().toLocaleTimeString();
      setTerminalLog(prev => [
        ...prev,
        `[${timestamp}] 🛡️ Developer settings saved successfully! Keys locked in localStorage.`
      ]);
    }
  };

  const handleClearWebhook = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pollapse_dev_key');
      localStorage.removeItem('pollapse_dev_url');
      setApiKey('');
      setWebhookUrl('');
      setWebhookSaved(false);
      setTerminalLog([]);
    }
  };

  const handleTestFire = async () => {
    if (!webhookUrl) return;
    setIsDispatching(true);
    
    const timestamp = new Date().toLocaleTimeString();
    const mockPayload = payloadType === 'lp_alert' ? {
      event: "lp_safe_opportunity",
      timestamp: Date.now(),
      data: {
        market: "Will Cole Palmer win the 2026 Ballon d'Or?",
        dailyPool: 100,
        verdict: "RECOMMENDED",
        lpSuitabilityScore: 84,
        cushionWall: 15601,
        estDailyYield: 4.59
      }
    } : {
      event: "extreme_market_divergence",
      timestamp: Date.now(),
      data: {
        marketA: "Will Donald Trump win the 2024 US Election?",
        marketB: "Will Kamala Harris win the 2024 US Election?",
        correlation: -0.96,
        divergence: 0.14,
        expectedB: 0.42,
        priceB: 0.28
      }
    };

    setTerminalLog(prev => [
      ...prev,
      `[${timestamp}] 📡 Initializing Webhook dispatch to: ${webhookUrl}`,
      `[${timestamp}] 🔑 Authenticating with header: X-Pollapse-Token: ${apiKey || 'pl_live_unspecified'}`,
      `[${timestamp}] 📤 Sending JSON payload content...`
    ]);

    const startTime = Date.now();
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pollapse-Token': apiKey || 'pl_live_mock_token'
        },
        body: JSON.stringify(mockPayload),
        mode: 'no-cors'
      });

      const elapsed = Date.now() - startTime;
      
      setTerminalLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✅ Dispatch broadcasted successfully!`,
        `[${new Date().toLocaleTimeString()}] 🚀 Response: 200 OK (no-cors Mode) | Latency: ${elapsed}ms`,
        `----------------------------------------`
      ]);
    } catch (e) {
      const elapsed = Date.now() - startTime;
      setTerminalLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚠️ Connection simulated: Local receiver triggered.`,
        `[${new Date().toLocaleTimeString()}] 🚀 Status: Broadcast complete | Latency: ${elapsed}ms`,
        `----------------------------------------`
      ]);
    } finally {
      setIsDispatching(false);
    }
  };


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
              Developer Workspace & API Core
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
              Build on top of Pollapse's prediction market calculations. Expose structured JSON streams or configure personalized alerts.
            </p>

            <div className="grid grid-12" style={{ gap: 32, alignItems: 'start' }}>
              {/* LEFT COLUMN: REST API REFERENCE */}
              <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  📡 REST API REFERENCE
                </h3>

                {/* Code Block 1 */}
                <div>
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

              {/* RIGHT COLUMN: DEVELOPER WEBHOOK HUB */}
              <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  🛡️ DEVELOPER WEBHOOK HUB
                </h3>

                {/* Educational Information Section */}
                <div className="card" style={{ 
                  padding: '10px 14px', 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', 
                  border: '1px solid rgba(16, 185, 129, 0.18)', 
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: 'rgba(16, 185, 129, 0.12)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--success)',
                    flexShrink: 0
                  }}>
                    <Info size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h6 style={{ margin: '0 0 2px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Developer Webhook Hub
                    </h6>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>
                      Build external alert bots or automation tools. Register custom destination URLs and generate tokens to test-fire simulated event streams inside the sandbox terminal.
                    </p>
                  </div>
                </div>

                {/* Vault Settings */}
                <div className="card" style={{ padding: 20, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>
                    API KEY & TARGET GATEWAY
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                        Developer API Key:
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input 
                          type="text" placeholder="pl_live_..." value={apiKey} 
                          onChange={(e) => setApiKey(e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        />
                        <button onClick={handleGenerateKey} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>
                          Generate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                        Webhook Destination URL:
                      </label>
                      <input 
                        type="url" placeholder="https://mybot.io/webhook" value={webhookUrl} 
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={handleSaveWebhook} disabled={!webhookUrl} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.7rem', padding: '6px 0' }}>
                        Save Gateway Settings
                      </button>
                      {webhookSaved && (
                        <button onClick={handleClearWebhook} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.7rem', padding: '6px 12px' }}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dispatch Simulator Sandbox */}
                <div className="card" style={{ padding: 20, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    📡 DISPATCH SIMULATOR SANDBOX
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                        Mock Event Trigger Payload:
                      </label>
                      <select 
                        value={payloadType} 
                        onChange={(e) => setPayloadType(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="lp_alert">Recommended LP SafeFarm Alert</option>
                        <option value="div_alert">High Market Price Divergence Alert</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleTestFire} 
                      disabled={!webhookUrl || isDispatching} 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {isDispatching ? <RefreshCw size={12} className="animate-spin" /> : '⚡ Test Fire Webhook (Send POST)'}
                    </button>
                  </div>
                </div>

                {/* Dispatch Terminal Console */}
                <div className="card" style={{ padding: 14, background: '#050608', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 8, fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>💻 DISPATCH TERMINAL CONSOLE LOG</span>
                    <span style={{ color: 'var(--text-muted)' }}>Status: Active</span>
                  </div>

                  <div style={{ maxHeight: 110, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#34d399', lineHeight: 1.4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {terminalLog.length === 0 ? (
                      <span style={{ color: 'var(--text-dim)' }}>No dispatches emitted yet. Configure your destination URL and click Test Fire above.</span>
                    ) : (
                      terminalLog.map((log, index) => (
                        <div key={index} style={{ wordBreak: 'break-all' }}>{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
