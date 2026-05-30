'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, ArrowUpRight, Cpu, Layers, Activity, Brain, Target, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  const modules = [
    {
      icon: <Layers size={20} style={{ color: '#3b82f6' }} />,
      title: 'Interactive Correlation Web',
      description: 'A hardware-accelerated D3.js force-directed physics graph clustering prediction events based on real-time Pearson correlation (r) coefficients. Link weights scale with absolute correlation strength, and node radii scale logarithmically with trade volume.',
      metrics: 'Threshold: |r| ≥ 0.4 · D3 Collision Physics'
    },
    {
      icon: <Target size={20} style={{ color: '#8b5cf6' }} />,
      title: 'Sector Indices Gauge',
      description: 'Bloomberg-style composite probability indices tracking macro domains (Politics, Crypto, Tech, Sports, etc.). By applying Logarithmic Volume Weighting (log10(volume + 1) + 1), we prevent outlier markets from drowning out sub-market predictive signals.',
      metrics: 'Outlier Suppression · Log-Volume Weighting'
    },
    {
      icon: <Activity size={20} style={{ color: '#10b981' }} />,
      title: 'Live Divergence Scanner',
      description: 'An automated analytical engine tracking price drift between highly correlated prediction legs. When positive or negative correlation legs drift apart, it automatically flags price gaps and recommends actionable mean-reversion buy/sell trades.',
      metrics: 'Drift Threshold: ≥ 3.0% · Severity Tiers'
    },
    {
      icon: <Brain size={20} style={{ color: '#f59e0b' }} />,
      title: 'Portfolio Thesis Workspace',
      description: 'A portfolio modeler mapping multi-legged macro bets. Integrates a dynamic redundancy checker that alerts you if your bets are set in duplicate directions on highly correlated markets, preserving capital efficiency.',
      metrics: 'Directional Redundancy Alerts · Local Persistence'
    },
    {
      icon: <Cpu size={20} style={{ color: '#06b6d4' }} />,
      title: 'Detailed Asset Workspaces',
      description: 'Single-market dashboards displaying detailed asset volumes, liquidity depths, and custom vector price histories. Features localized dependency tree maps showing adjacent market correlations.',
      metrics: 'SVG Price Timeline · Correlation Dependencies'
    },
    {
      icon: <ShieldCheck size={20} style={{ color: '#ef4444' }} />,
      title: 'Cached Serverless Proxy Layer',
      description: 'Protects the terminal from Cloudflare rate limits and API throttling. Implements server-side in-memory Map caches with pre-defined TTL parameters (15s for orderbooks, 2min for markets, 5min for heavy correlations).',
      metrics: 'Cloudflare Throttling Safe · Sub-10ms UI Repaints'
    }
  ];

  return (
    <div className="container page-content animate-fade-in">
      {/* Back to Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Hero Section */}
      <section className="hero" style={{ padding: '48px 0 32px' }}>
        <div className="hero-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
          PROTOCOL SPECIFICATIONS & MISSION BLUEPRINT
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.75rem', marginTop: 12, marginBottom: 16 }}>
          The Mathematical Intelligence Layer<br />
          <span className="highlight" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>For Prediction Markets</span>
        </h1>
        <p className="hero-description" style={{ maxWidth: '800px', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Pollapse is the premier institutional-grade cross-market intelligence and trading terminal designed specifically for the Polymarket CLOB V2 ecosystem. We uncover correlation webs, price anomalies, and composite domain sentiments that are invisible in traditional silos.
        </p>
      </section>

      {/* Narrative Split Section */}
      <div className="grid grid-3" style={{ gap: 32, alignItems: 'stretch', marginBottom: 56 }}>
        {/* Narratives: Left 2 Columns */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
              The Philosophy Behind Pollapse
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Prediction markets represent one of the most powerful aggregators of human knowledge and forecasting on Earth. However, individual prediction contracts operate as silos. We believe that the real alpha is hidden not within individual markets, but in the **mathematical spaces between them**.
              <br /><br />
              Pollapse connects the dots. By analyzing historical daily pricing vectors and aligning time series data, we calculate Pearson correlation coefficients and composite sector averages, enabling traders to view prediction markets as a unified global sentiment matrix.
            </p>
          </div>
        </div>

        {/* Builder Profile: Right 1 Column */}
        <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: 'white', fontWeight: 800 }}>
              L
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Leknax</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 12 }}>
              Lead Protocol Architect
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>
              Expert blockchain engineer and quant developer. Dedicated to engineering high-performance decentralized systems, data terminals, and trading tools.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://github.com/Lesnak1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              GitHub Profile <ArrowUpRight size={12} />
            </a>
            <a
              href="https://x.com/LesnaCrex"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Twitter / X Account <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Comprehensive Modules Grid */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          Detailed Protocol Specifications
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 32 }}>
          An expert analysis of all active mathematical and ingestion systems running under the Pollapse shell.
        </p>

        <div className="grid grid-3 stagger" style={{ gap: 24 }}>
          {modules.map((mod, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: 28,
                background: 'var(--bg-layer-2)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16
              }}
            >
              <div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-layer-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {mod.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {mod.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                  {mod.description}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {mod.metrics}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Redirect to Docs */}
      <div
        className="card"
        style={{
          padding: 24,
          background: 'var(--bg-layer-3)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>📖</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Looking for detailed mathematical specifications?</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Explore our Pearson alignment formulas, indices weighting algorithms, and protocol roadmap.</p>
          </div>
        </div>
        <Link href="/docs" className="btn btn-primary btn-sm">
          Go to Knowledge Hub <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
