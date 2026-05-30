'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Award, Users, Heart, ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function AboutPage() {
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
        <div className="hero-eyebrow">
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
          OUR MISSION & PROTOCOL ARCHITECTURE
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.75rem', marginBottom: 16 }}>
          Demystifying Prediction Markets<br />
          <span className="highlight" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>For Global Traders</span>
        </h1>
        <p className="hero-description" style={{ maxWidth: '750px', fontSize: '0.95rem' }}>
          Pollapse is the institutional-grade intelligence layer designed specifically to uncover correlation webs, anomalies, and dependencies within the Polymarket CLOB ecosystem.
        </p>
      </section>

      {/* Three Pillars Core Cards */}
      <div className="grid grid-3 stagger" style={{ gap: 24, marginBottom: 56 }}>
        <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
          <div style={{ fontSize: '1.75rem', marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Spotting Anomalies</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            Markets are naturally fragmented. Pollapse solves this by actively scanning and identifying historical correlations that have drifted apart, presenting actionable statistical convergence arbitrage opportunities.
          </p>
        </div>

        <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
          <div style={{ fontSize: '1.75rem', marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Logarithmic Averages</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            Standard averages let massive politics events drown out subtle signals. Our custom logarithmic volume weighting metrics calculate pure domain sentiment indices acrosspolitics, crypto, and technology sectors.
          </p>
        </div>

        <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
          <div style={{ fontSize: '1.75rem', marginBottom: 16 }}>🛡️</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Capital Efficiency</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            Our dynamic multi-leg Thesis Workspace analyzes your potential bets for directional redundancy warnings, helping you diversify directional risk and preserve capital efficiently.
          </p>
        </div>
      </div>

      {/* Main Narrative Split Section */}
      <div className="grid grid-3" style={{ gap: 32, alignItems: 'center', marginBottom: 56 }}>
        
        {/* Narratives: Left 2 Columns */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              The Philosophy Behind Pollapse
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Prediction markets represent one of the most powerful aggregators of human knowledge on Earth. However, individual markets operate as siloes. We believe that the real alpha is hidden not within individual markets, but in the **mathematical spaces between them**. 
              <br /><br />
              Pollapse connects the dots. By analyzing historical pricing arrays and aligning time series data, we enable traders to treat prediction markets as a unified global sentiment matrix.
            </p>
          </div>
        </div>

        {/* Builder Badge: Right 1 Column */}
        <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: 'white', fontWeight: 800 }}>
            L
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Leknax</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 12 }}>
            Lead Protocol Architect
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>
            Expert blockchain engineer and builder. Dedicated to pushing the boundaries of decentralization, data terminals, and trading tools.
          </p>
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

      {/* Directing to mathematical specs */}
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
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Explore our Pearson alignment matrices and protocol roadmap timelines.</p>
          </div>
        </div>
        <Link href="/docs" className="btn btn-primary btn-sm">
          Go to Knowledge Hub <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
