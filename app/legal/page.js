'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Scale, HelpCircle } from 'lucide-react';

export default function LegalPage() {
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
          <span className="badge badge-red">
            <Scale size={12} style={{ marginRight: 4 }} /> COMPLIANCE & LEGAL
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Protocol <span className="highlight" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Compliance Agreements</span>
          </h1>
          <p className="section-subtitle">
            Please read the Terms of Service, Privacy Policy, and crucial Prediction Market Disclaimers.
          </p>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 32, alignItems: 'flex-start' }}>
        {/* Left 2 Columns: Main Legal Text */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* CRITICAL RISK DISCLAIMER */}
          <div className="card" style={{ padding: 32, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.03)', borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={20} /> VERY IMPORTANT: HIGH-RISK DISCLAIMER
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Pollapse is solely a statistical intelligence, analytics, and thesis portfolio modeling terminal. We are not an exchange, broker, or financial advisor. All information presented on this platform—including Pearson correlation coefficients, composite indices, and divergence convergence recommendations—represents mathematical outputs of historical public data. They are not financial recommendations, buy/sell directives, or investment advice.
              <br /><br />
              Prediction markets carry substantial financial risks, high volatility, and complete capital loss hazards. Past performance of correlated assets is never a guarantee of future convergence. By using this software, you assume 100% of all trading risks and hold Pollapse, Leknax, and all affiliates completely harmless of any financial losses.
            </p>
          </div>

          {/* Terms of Service */}
          <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
              1. Terms of Service
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              By accessing the Pollapse interface, you agree to comply with and be bound by these Terms of Service. If you disagree with any clause of these terms, you must immediately cease all access to this web application.
            </p>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Use of Platform</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The software and code are provided as-is. Users are authorized to explore network clusters, calculate thesis legs, and consult dynamic scanner logs. Users may not attempt to reverse engineer backend proxy requests, disrupt API buffers, or load the endpoints with denial-of-service stress loads.
            </p>
          </div>

          {/* Privacy Policy */}
          <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
              2. Privacy & Cookie Policy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Pollapse values user privacy and is designed from the ground up to respect data minimization standards.
            </p>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Zero Personal Data Collection</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              We do not collect, store, or sell any personal identifying information, IP addresses, or wallet private keys. All thesis data, settings presets, and light/dark theme parameters are stored **locally** on your own computer inside your browser&apos;s <code>localStorage</code> database. We use no marketing cookies, trackers, or third-party advertising scripts.
            </p>
          </div>
        </div>

        {/* Right 1 Column: Quick Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="card" style={{ padding: 24, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={16} style={{ color: 'var(--primary)' }} /> Quick Legal Specs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>Advisor Status</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NON-ADVISORY</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>Custodial Holding</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NON-CUSTODIAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>Fee Collection</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>0% (V1.0 MVP)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>User Data Logging</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>0% ZERO STORAGE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
