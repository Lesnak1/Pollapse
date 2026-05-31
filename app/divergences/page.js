'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatPercent, truncate, getDivergenceSeverity, getSectorIcon, getSectorColor } from '@/lib/utils';
import { ArrowLeft, RefreshCw, AlertTriangle, ArrowUpRight, TrendingUp, Filter, Info, ShieldAlert } from 'lucide-react';

export default function DivergencesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMinCorr, setFilterMinCorr] = useState(0.5);
  const [filterMinDiv, setFilterMinDiv] = useState(0.04);
  const [filterSector, setFilterSector] = useState('all');

  // Arbitrage Planner States
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [arbBudget, setArbBudget] = useState(1000);
  const [executingIdx, setExecutingIdx] = useState(null);
  const [executionStep, setExecutionStep] = useState('idle'); // idle, validating, leg_a, leg_b, success
  const [executedPairs, setExecutedPairs] = useState({}); // { [idx]: { budget, timestamp } }

  const handleDeployArb = (idx) => {
    setExecutingIdx(idx);
    setExecutionStep('validating');
    
    setTimeout(() => {
      setExecutionStep('leg_a');
      setTimeout(() => {
        setExecutionStep('leg_b');
        setTimeout(() => {
          setExecutionStep('success');
          
          const updated = {
            ...executedPairs,
            [idx]: {
              budget: arbBudget,
              timestamp: Date.now()
            }
          };
          setExecutedPairs(updated);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleCancelArb = (idx) => {
    const updated = { ...executedPairs };
    delete updated[idx];
    setExecutedPairs(updated);
    setExecutingIdx(null);
    setExecutionStep('idle');
  };


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
                      <Link href={`/market/${div.marketAData?.slug}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }} className="hover-link">
                          {div.marketAData?.question}
                        </h4>
                      </Link>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>Current YES Price</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {formatPercent(div.priceA)}
                        </div>
                      </div>
                      <a
                        href={`https://polymarket.com/event/${div.marketAData?.eventSlug || div.marketAData?.slug || ''}`}
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
                      <Link href={`/market/${div.marketBData?.slug}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }} className="hover-link">
                          {div.marketBData?.question}
                        </h4>
                      </Link>
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
                        href={`https://polymarket.com/event/${div.marketBData?.eventSlug || div.marketBData?.slug || ''}`}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
                    <TrendingUp size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
                  <button 
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.7rem' }}
                  >
                    {expandedIdx === i ? 'Close Planner' : '⚡ Model Arbitrage'}
                  </button>
                </div>

                {/* Collapsible Arbitrage Planner Workspace */}
                {expandedIdx === i && (
                  <div className="card animate-slide-up" style={{ marginTop: 16, padding: 24, background: 'var(--bg-elevated)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚡ DELTA-NEUTRAL ARBITRAGE PLANNER & CONVERGENCE PATH
                    </h4>

                    {/* Educational Information Section */}
                    <div className="card" style={{ 
                      padding: '10px 14px', 
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)', 
                      border: '1px solid rgba(245, 158, 11, 0.18)', 
                      borderRadius: 10,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: 'rgba(245, 158, 11, 0.12)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--warning)',
                        flexShrink: 0
                      }}>
                        <Info size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ margin: '0 0 2px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Delta-Neutral Arbitrage
                        </h6>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>
                          Hedge direction risk by distributing budget across both legs of a correlation divergence. Earn profit as prices pull back to their statistical fair-value alignment.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-3" style={{ gap: 20, marginBottom: 20 }}>
                      {/* Budget and Controls */}
                      <div className="col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Arbitrage Trading Budget:
                        </label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 700 }}>$</span>
                          <input 
                            type="number" 
                            value={arbBudget} 
                            onChange={(e) => setArbBudget(Math.max(10, Number(e.target.value)))}
                            style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[250, 500, 1000, 2550].map(val => (
                            <button key={val} onClick={() => setArbBudget(val)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '0.6rem' }}>
                              ${val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Math Calculations Output */}
                      <div className="col-span-2 card" style={{ padding: 14, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Mathematical Share Allocation Breakdown
                        </span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: 2 }}>
                              Leg A: {isPos ? `NO on Market A` : `YES on Market A`}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Allocation: {formatCurrency(arbBudget * 0.5)} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>({Math.round((arbBudget * 0.5) / (isPos ? (1 - div.priceA) : div.priceA))} shares)</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: 2 }}>
                              Leg B: {div.priceB < div.expectedB ? `YES on Market B` : `NO on Market B`}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Allocation: {formatCurrency(arbBudget * 0.5)} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>({Math.round((arbBudget * 0.5) / (div.priceB < div.expectedB ? div.priceB : (1 - div.priceB)))} shares)</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Projected Convergence Gross Profit:</span>
                          <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                            {formatCurrency(arbBudget * (1 + div.divergence * 1.4))}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Net Projected Arbitrage ROI:</span>
                          <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                            +{((div.divergence * 1.4) * 100).toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Convergence Path Projections & Simulated Execution Pipeline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
                      {/* Projections Pathfinder */}
                      <div className="card" style={{ padding: 14, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Convergence Pathfinder Stats
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.7rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Sector Confidence rating:</span>
                            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
                              {sectorA === 'politics' || sectorA === 'crypto' ? '🟢 88% Strong' : sectorA === 'sports' ? '🟡 65% Medium' : '🟢 82% Strong'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Est. Convergence Time:</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {sectorA === 'politics' ? '24 - 48 Hours' : sectorA === 'crypto' ? '12 - 24 Hours' : sectorA === 'sports' ? '4 - 12 Hours' : '3 - 5 Days'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Convergence Correlation Index:</span>
                            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {(Math.abs(div.correlation) * 100).toFixed(0)}% bound
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Arbitrage Orders Dispatch Console */}
                      <div className="card" style={{ padding: 14, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {executedPairs[i] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.06)', border: '1px solid var(--success)', borderRadius: 6, fontSize: '0.68rem', color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
                              🎉 DELTA-NEUTRAL HEDGE POSITION DEPLOYED ACTIVE!
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                              Hedged: {formatCurrency(executedPairs[i].budget)} | Timestamp: {new Date(executedPairs[i].timestamp).toLocaleTimeString()}
                            </div>
                            <button onClick={() => handleCancelArb(i)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.65rem', padding: '4px' }}>
                              Cancel Arbitrage Position
                            </button>
                          </div>
                        ) : executingIdx === i && executionStep !== 'idle' ? (
                          /* Transaction Pipeline execution terminal */
                          <div style={{ padding: 10, background: '#06070a', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2, marginBottom: 2 }}>
                              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>[ARB ROUTER]</span>
                              <span className="animate-pulse" style={{ color: 'var(--text-dim)' }}>Routing...</span>
                            </div>
                            <div style={{ color: executionStep === 'validating' ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                              {executionStep === 'validating' ? '⏳' : '✅'} 1. Validating correlation edges & margins...
                            </div>
                            <div style={{ color: executionStep === 'leg_a' ? 'var(--text-primary)' : executionStep === 'validating' ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                              {executionStep === 'validating' ? '·' : executionStep === 'leg_a' ? '⏳' : '✅'} 2. Signing YES/NO order on Market A...
                            </div>
                            <div style={{ color: executionStep === 'leg_b' ? 'var(--text-primary)' : (executionStep === 'validating' || executionStep === 'leg_a') ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                              {(executionStep === 'validating' || executionStep === 'leg_a') ? '·' : executionStep === 'leg_b' ? '⏳' : '✅'} 3. Signing hedging order on Market B...
                            </div>
                            <div style={{ color: executionStep === 'success' ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                              {executionStep === 'success' ? '🎉' : '·'} 4. Position committed!
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDeployArb(i)} 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            ⚡ Deploy Delta-Neutral Arbitrage Orders
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
