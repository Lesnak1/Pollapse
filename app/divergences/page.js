'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPercent, truncate, getDivergenceSeverity, getSectorIcon, getSectorColor } from '@/lib/utils';
import { ArrowLeft, RefreshCw, AlertTriangle, ArrowUpRight, TrendingUp, Filter, Info, ShieldAlert } from 'lucide-react';

export default function DivergencesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMinCorr, setFilterMinCorr] = useState(0.5);
  const [filterMinDiv, setFilterMinDiv] = useState(0.04);
  const [filterSector, setFilterSector] = useState('all');

  async function loadDivergences() {
    setLoading(true);
    try {
      const res = await fetch(`/api/correlations?min=0.3&limit=50`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Error loading correlations:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDivergences();
  }, []);

  const rawDivergences = data?.divergences || [];

  // Filter divergences client-side for immediate feedback
  const filteredDivergences = rawDivergences.filter(div => {
    const meetsCorr = Math.abs(div.correlation) >= filterMinCorr;
    const meetsDiv = div.divergence >= filterMinDiv;
    const meetsSector =
      filterSector === 'all' ||
      div.marketAData?.sector === filterSector ||
      div.marketBData?.sector === filterSector;
    return meetsCorr && meetsDiv && meetsSector;
  });

  return (
    <div className="container page-content animate-fade-in">
      {/* Back to Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-amber">
            <ShieldAlert size={12} style={{ marginRight: 4 }} /> ALPHA SIGNAL SCANNER
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Real-Time <span className="highlight" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Divergence Signals</span>
          </h1>
          <p className="section-subtitle">
            Find inefficiencies in correlated markets. When historically bound markets diverge, convergence is a statistical probability.
          </p>
        </div>
        <button
          onClick={loadDivergences}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Scan
        </button>
      </div>

      {/* Info banner */}
      <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Info size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Understanding Divergence Arbitrage</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              If Market A and Market B are 90% positively correlated, their contract prices should move in tandem. If Market A trades at **70¢** and Market B trades at **50¢**, a **20% divergence** exists. Capitalize by purchasing **YES contracts on the lagging Market B** or shorting the over-indexed market.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scanner Controls</h3>
        </div>
        <div className="grid grid-3" style={{ gap: 24 }}>
          {/* Min Correlation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>
              Minimum Correlation: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{formatPercent(filterMinCorr)}</span>
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={filterMinCorr}
              onChange={(e) => setFilterMinCorr(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--warning)' }}
            />
          </div>

          {/* Min Divergence Gap */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>
              Minimum Divergence Gap: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{formatPercent(filterMinDiv)}</span>
            </label>
            <input
              type="range"
              min="0.02"
              max="0.2"
              step="0.01"
              value={filterMinDiv}
              onChange={(e) => setFilterMinDiv(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--warning)' }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>
              Focus Sector
            </label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-layer-3)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="all">All Sectors</option>
              <option value="politics">Politics</option>
              <option value="crypto">Crypto</option>
              <option value="geopolitics">Geopolitics</option>
              <option value="economics">Economics</option>
              <option value="tech">Tech</option>
              <option value="sports">Sports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }}></div>
          ))}
        </div>
      ) : filteredDivergences.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-dim)', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-primary)' }}>No Divergences Found</h3>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Try reducing the correlation strength threshold or lowering the minimum divergence gap limit.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="stagger">
          {filteredDivergences.map((div, i) => {
            const severity = getDivergenceSeverity(div.divergence);
            const isPos = div.correlation > 0;
            const sectorA = div.marketAData?.sector || 'other';
            const sectorB = div.marketBData?.sector || 'other';

            return (
              <div
                key={i}
                className={`card divergence-detail-card`}
                style={{
                  padding: 32,
                  background: 'var(--bg-layer-2)',
                  border: `1px solid ${severity.color}30`,
                  borderLeft: `5px solid ${severity.color}`,
                  borderRadius: 16,
                  transition: 'transform 0.2s',
                  boxShadow: `0 4px 30px ${severity.color}05`,
                }}
              >
                {/* Upper Metadata Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge`} style={{ background: `${severity.color}15`, color: severity.color, fontWeight: 600 }}>
                      {severity.emoji} {severity.label} Divergence
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Historical correlation:{' '}
                      <strong style={{ color: isPos ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                        {isPos ? '+' : ''}
                        {formatPercent(div.correlation)}
                      </strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Divergence Gap:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: severity.color, fontFamily: 'var(--font-mono)' }}>
                      {formatPercent(div.divergence)}
                    </span>
                  </div>
                </div>

                {/* Main Content Columns: Market A & Market B */}
                <div className="grid grid-2" style={{ gap: 32, position: 'relative' }}>
                  {/* Left Column: Market A */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>MARKET A</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {getSectorIcon(sectorA)} {sectorA}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {div.marketAData?.question}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>Current YES Price</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {formatPercent(div.priceA)}
                        </div>
                      </div>
                      <a
                        href={`https://polymarket.com/event/${div.marketAData?.slug || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Trade Market A <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Market B */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid var(--border-color)', paddingLeft: 32 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>MARKET B</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {getSectorIcon(sectorB)} {sectorB}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {div.marketBData?.question}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Current YES Price</span>
                          <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: 'var(--bg-layer-3)', borderRadius: 4, color: 'var(--text-dim)' }}>
                            Expected: {formatPercent(div.expectedB)}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: severity.color }}>
                          {formatPercent(div.priceB)}
                        </div>
                      </div>
                      <a
                        href={`https://polymarket.com/event/${div.marketBData?.slug || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Trade Market B <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Suggested Action Bar */}
                <div
                  style={{
                    marginTop: 24,
                    padding: '16px 24px',
                    background: 'var(--bg-layer-3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Trade Hypothesis:</strong>{' '}
                      {isPos ? (
                        div.priceB < div.expectedB ? (
                          <>
                            Lagging Market B is <span style={{ color: 'var(--success)', fontWeight: 600 }}>underpriced</span> relative to Market A. Recommend buying <strong>YES</strong> on Market B or buying <strong>NO</strong> on Market A.
                          </>
                        ) : (
                          <>
                            Lagging Market B is <span style={{ color: 'var(--danger)', fontWeight: 600 }}>overpriced</span> relative to Market A. Recommend buying <strong>NO</strong> on Market B or buying <strong>YES</strong> on Market A.
                          </>
                        )
                      ) : (
                        div.priceB < div.expectedB ? (
                          <>
                            Lagging Market B is <span style={{ color: 'var(--success)', fontWeight: 600 }}>underpriced</span>. Recommend buying <strong>YES</strong> on both markets (highly inversely correlated).
                          </>
                        ) : (
                          <>
                            Lagging Market B is <span style={{ color: 'var(--danger)', fontWeight: 600 }}>overpriced</span>. Recommend buying <strong>NO</strong> on both markets.
                          </>
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
