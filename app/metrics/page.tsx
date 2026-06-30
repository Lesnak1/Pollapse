'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, BarChart3, Wallet, Activity, Award } from 'lucide-react';

export default function MetricsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to retrieve builder statistics');
      const json = await res.json();
      if (json.success) {
        setData(json.metrics);
      } else {
        setError(json.error || 'Unknown server error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="container page-content animate-fade-in" style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Award size={12} /> Grant Compliance Hub
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Builder <span className="highlight" style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Attribution Metrics</span>
          </h1>
          <p className="section-subtitle">
            Real-time verification of trades and volume routed through the Pollapse terminal.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stats
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 32, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 16, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--error)', margin: '0 0 8px 0' }}>Metrics Load Error</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>{error}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Volume Card */}
            <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Attributed Volume</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                    ${data.volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ padding: 10, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, color: '#3b82f6' }}>
                  <BarChart3 size={22} />
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Target: $50,000 builder requirement
              </div>
            </div>

            {/* Trades Card */}
            <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Attributed Orders</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                    {data.trades}
                  </div>
                </div>
                <div style={{ padding: 10, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 10, color: '#a855f7' }}>
                  <Activity size={22} />
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Trades routed through safe client API
              </div>
            </div>

            {/* Fees Card */}
            <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Builder Fees Accrued</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                    ${data.fees.toLocaleString('en-US', { minimumFractionDigits: 4 })}
                  </div>
                </div>
                <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, color: '#10b981' }}>
                  <Wallet size={22} />
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Real-time maker incentives
              </div>
            </div>
          </div>

          {/* Builder registry info */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Attribution Status & Configurations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>Active Builder Code:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, wordBreak: 'break-all' }}>{data.builderCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>Chain Routing Network:</span>
                <span>Polygon Mainnet (137)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Verification Signature:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active (EIP-712 Attributed)</span>
              </div>
            </div>
          </div>

          {/* Verification / Placeholder warning */}
          {data.trades === 0 && (
            <div className="card" style={{
              padding: 24,
              background: 'rgba(245, 158, 11, 0.03)',
              border: '1px dashed rgba(245, 158, 11, 0.25)',
              borderRadius: 16,
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--warning)', fontWeight: 700, fontSize: '0.9rem' }}>
                ⚠️ Live Sandbox Attributions Pending
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                No volume has accrued yet. Once you deploy your Safe wallet on the <Link href="/trade-test" style={{ color: '#3b82f6', textDecoration: 'underline' }}>sandbox route</Link> or trade divergence/thesis signals, orders will populate and report here in real-time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
