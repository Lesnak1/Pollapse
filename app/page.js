'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber, truncate, getSectorColor, getSectorIcon, getDivergenceSeverity } from '@/lib/utils';

export default function DashboardPage() {
  const [sectors, setSectors] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pollapse_dismissed_bot_alert');
    if (!dismissed) {
      setShowAlert(true);
    }
  }, []);

  const handleDismissAlert = () => {
    setShowAlert(false);
    localStorage.setItem('pollapse_dismissed_bot_alert', 'true');
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [sectorsRes, correlationsRes, marketsRes] = await Promise.allSettled([
          fetch('/api/sectors').then(r => r.json()),
          fetch('/api/correlations?limit=30').then(r => r.json()),
          fetch('/api/markets?limit=10').then(r => r.json()),
        ]);
        if (sectorsRes.status === 'fulfilled') setSectors(sectorsRes.value);
        if (correlationsRes.status === 'fulfilled') setCorrelations(correlationsRes.value);
        if (marketsRes.status === 'fulfilled') setMarkets(marketsRes.value);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMarkets = markets?.total || 0;
  const strongCorr = correlations?.stats?.strongCorrelations || 0;
  const divCount = correlations?.stats?.divergenceCount || 0;
  const topPair = correlations?.pairs?.[0];

  return (
    <div className="container page-content">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
          CROSS-MARKET INTELLIGENCE ENGINE
        </div>
        <h1 className="hero-title">
          See the Markets<br />
          <span className="highlight">Others Can&apos;t</span>
        </h1>
        <p className="hero-description">
          Pollapse maps hidden correlations between 600+ Polymarket events, detects divergence signals,
          and helps you build multi-market theses — all in one premium intelligence platform.
        </p>
        <div className="hero-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          <Link href="/correlations" className="btn btn-primary btn-lg">
            ⚡ Explore Correlations
          </Link>
          <Link href="/divergences" className="btn btn-secondary btn-lg">
            🔍 Scan Divergences
          </Link>
          <Link href="/thesis" className="btn btn-secondary btn-lg" style={{ border: '1px solid var(--accent-purple)' }}>
            🧠 Thesis Builder
          </Link>
          <Link href="/metrics" className="btn btn-secondary btn-lg" style={{ border: '1px solid var(--primary)' }}>
            📊 Builder Metrics
          </Link>
        </div>
      </section>

      {/* ===== DISMISSABLE BOT ALERT ===== */}
      {showAlert && (
        <div className="card animate-fade-in" style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)', display: 'inline-block', flexShrink: 0 }}></span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              🤖 <strong style={{ color: 'var(--text-primary)' }}>Personalized Alerts on Telegram:</strong> Track SafeFarm cushion walls and custom budget qualification limits directly in your pocket. Connect our interactive bot: <a href="https://t.me/PollapseBot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}>@PollapseBot <ArrowUpRight size={12} /></a>
            </div>
          </div>
          <button 
            onClick={handleDismissAlert} 
            className="btn btn-ghost" 
            style={{ 
              padding: 4, 
              borderRadius: '50%', 
              color: 'var(--text-dim)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===== STATS BAR ===== */}
      <div className="stats-bar stagger">
        <div className="stat-card">
          <div className="stat-label">Active Markets</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>
            {loading ? <span className="skeleton" style={{ width: 60, height: 28, display: 'inline-block' }}></span> : formatNumber(totalMarkets)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Markets Analyzed</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>
            {loading ? <span className="skeleton" style={{ width: 40, height: 28, display: 'inline-block' }}></span> : (correlations?.stats?.marketsAnalyzed || '—')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Strong Correlations</div>
          <div className="stat-value up" style={{ fontFamily: 'var(--font-mono)' }}>
            {loading ? <span className="skeleton" style={{ width: 40, height: 28, display: 'inline-block' }}></span> : strongCorr}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Divergence Signals</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: divCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {loading ? <span className="skeleton" style={{ width: 40, height: 28, display: 'inline-block' }}></span> : divCount}
          </div>
        </div>
      </div>

      {/* ===== TRENDING CORRELATIONS ===== */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title"><span className="icon">🔗</span> Trending Correlations</h2>
            <p className="section-subtitle">Markets that move together — updated every 5 minutes</p>
          </div>
          <Link href="/correlations" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }}></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-2 stagger">
            {(correlations?.pairs || []).slice(0, 4).map((pair, i) => (
              <div key={i} className="pair-card">
                <div className="pair-markets">
                  <div className="pair-market-name">{truncate(pair.marketATitle, 50)}</div>
                  <div className="pair-connector">correlates with</div>
                  <div className="pair-market-name">{truncate(pair.marketBTitle, 50)}</div>
                </div>
                <div
                  className="pair-correlation"
                  style={{ color: pair.correlation > 0 ? 'var(--success)' : 'var(--danger)' }}
                >
                  {pair.correlation > 0 ? '+' : ''}{formatPercent(pair.correlation)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== SECTOR OVERVIEW ===== */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title"><span className="icon">📊</span> Sector Indices</h2>
            <p className="section-subtitle">Composite probability indices across market categories</p>
          </div>
          <Link href="/sectors" className="btn btn-ghost btn-sm">View details →</Link>
        </div>

        {loading ? (
          <div className="grid grid-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }}></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-3 stagger">
            {Object.entries(sectors?.sectors || {}).map(([key, sector]) => (
              <Link href="/sectors" key={key}>
                <div className="sector-card">
                  <div className="sector-card-header">
                    <div className="sector-icon" style={{ background: `${sector.color}15` }}>
                      {sector.icon}
                    </div>
                    <div>
                      <div className="sector-name">{sector.name}</div>
                      <div className="sector-count">{sector.marketCount} markets</div>
                    </div>
                  </div>
                  <div className="sector-index" style={{ color: sector.color }}>
                    {formatPercent(sector.index)}
                  </div>
                  <div className="sector-bar">
                    <div
                      className="sector-bar-fill"
                      style={{
                        width: `${sector.index * 100}%`,
                        background: sector.gradient,
                      }}
                    ></div>
                  </div>
                  <div className="sector-markets-preview">
                    {(sector.topMarkets || []).slice(0, 3).map((m, i) => (
                      <div key={i} className="sector-market-row">
                        <span className="name">{truncate(m.question, 35)}</span>
                        <span className="price">{formatPercent(m.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== HOT DIVERGENCES ===== */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title"><span className="icon">⚡</span> Hot Divergences</h2>
            <p className="section-subtitle">Correlated markets that currently disagree — potential alpha signals</p>
          </div>
          <Link href="/divergences" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-2">
            {[1,2].map(i => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }}></div>
            ))}
          </div>
        ) : (correlations?.divergences || []).length > 0 ? (
          <div className="grid grid-2 stagger">
            {(correlations?.divergences || []).slice(0, 4).map((div, i) => {
              const severity = getDivergenceSeverity(div.divergence);
              return (
                <div key={i} className={`divergence-card ${severity.level}`}>
                  <div className="divergence-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge badge-${severity.level === 'extreme' ? 'red' : severity.level === 'significant' ? 'amber' : 'muted'}`}>
                        {severity.emoji} {severity.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatPercent(Math.abs(div.correlation))} correlated
                      </span>
                    </div>
                    <div className="divergence-magnitude" style={{ color: severity.color }}>
                      {formatPercent(div.divergence)}
                    </div>
                  </div>
                  <div className="divergence-markets">
                    <div className="divergence-market">
                      <div className="divergence-market-label">Market A</div>
                      <div className="divergence-market-title">
                        {truncate(div.marketAData?.question || div.marketA, 50)}
                      </div>
                      <div className="divergence-market-price">{formatPercent(div.priceA)}</div>
                    </div>
                    <div className="divergence-market">
                      <div className="divergence-market-label">Market B</div>
                      <div className="divergence-market-title">
                        {truncate(div.marketBData?.question || div.marketB, 50)}
                      </div>
                      <div className="divergence-market-price">{formatPercent(div.priceB)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎯</p>
            <p>No significant divergences detected right now.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Markets are currently aligned — check back soon.</p>
          </div>
        )}
      </section>

      {/* ===== TOP MARKETS ===== */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title"><span className="icon">🔥</span> Top Markets by Volume</h2>
            <p className="section-subtitle">Most actively traded prediction markets</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }}></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-2 stagger">
            {(markets?.markets || []).slice(0, 8).map((market, i) => (
              <Link
                key={i}
                href={`/market/${market.slug}`}
                className="market-card"
              >
                <div className="market-card-header">
                  <div className="market-card-title">{truncate(market.question, 65)}</div>
                  <div
                    className="market-card-price"
                    style={{
                      color: market.price > 0.6
                        ? 'var(--success)'
                        : market.price < 0.4
                          ? 'var(--danger)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {formatPercent(market.price)}
                  </div>
                </div>
                <div className="market-card-footer">
                  <span className={`badge badge-${
                    market.sector === 'politics' ? 'blue' :
                    market.sector === 'crypto' ? 'amber' :
                    market.sector === 'sports' ? 'purple' :
                    market.sector === 'geopolitics' ? 'red' :
                    market.sector === 'economics' ? 'green' :
                    'muted'
                  }`}>
                    {getSectorIcon(market.sector)} {market.sector}
                  </span>
                  <span className="market-card-volume">
                    Vol: {formatCurrency(market.volume)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
