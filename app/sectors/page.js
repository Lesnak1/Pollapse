'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatPercent, truncate, getSectorColor, getSectorIcon, getSectorGradient } from '@/lib/utils';
import { ArrowLeft, TrendingUp, TrendingDown, Layers, BarChart3, HelpCircle, ArrowUpRight } from 'lucide-react';

export default function SectorsPage() {
  const [sectors, setSectors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    async function loadSectors() {
      try {
        const res = await fetch('/api/sectors');
        const data = await res.json();
        setSectors(data.sectors || {});
        // Select politics as default for drill-down
        if (data.sectors && Object.keys(data.sectors).length > 0) {
          setSelectedSector(Object.keys(data.sectors)[0]);
        }
      } catch (e) {
        console.error('Error loading sectors:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSectors();
  }, []);

  const selectedSectorData = selectedSector ? sectors?.[selectedSector] : null;

  return (
    <div className="container page-content animate-fade-in">
      {/* Back to Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 40 }}>
        <div>
          <span className="badge badge-blue">
            <Layers size={12} style={{ marginRight: 4 }} /> SECTOR INDICES
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Bloomberg-Style <span className="highlight">Sector Indices</span>
          </h1>
          <p className="section-subtitle">
            Composite probabilities weighted by market log-volume, tracking real-time global sentiment.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-3" style={{ marginBottom: 48 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }}></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-3" style={{ marginBottom: 48 }}>
          {Object.entries(sectors || {}).map(([key, sector]) => {
            const isSelected = selectedSector === key;
            const indexValue = sector.index;
            // Interpret sentiment based on index value
            const isBullish = indexValue > 0.55;
            const isBearish = indexValue < 0.45;

            return (
              <div
                key={key}
                className={`sector-card interactive-card ${isSelected ? 'active-sector' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${sector.color}` : '1px solid var(--border-color)',
                  boxShadow: isSelected ? `0 0 20px ${sector.color}15` : 'none',
                }}
                onClick={() => setSelectedSector(key)}
              >
                <div className="sector-card-header">
                  <div className="sector-icon" style={{ background: `${sector.color}15`, color: sector.color }}>
                    {sector.icon}
                  </div>
                  <div>
                    <h3 className="sector-name" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{sector.name}</h3>
                    <span className="sector-count" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {sector.marketCount} Component Markets
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                  <span className="sector-index" style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sector.color }}>
                    {formatPercent(indexValue)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: isBullish ? 'var(--success)' : isBearish ? 'var(--danger)' : 'var(--text-dim)',
                    }}
                  >
                    {isBullish ? (
                      <>
                        <TrendingUp size={14} /> Bullish
                      </>
                    ) : isBearish ? (
                      <>
                        <TrendingDown size={14} /> Bearish
                      </>
                    ) : (
                      'Neutral'
                    )}
                  </span>
                </div>

                <div className="sector-bar" style={{ height: 6, background: 'var(--bg-layer-3)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                  <div
                    className="sector-bar-fill"
                    style={{
                      height: '100%',
                      width: `${indexValue * 100}%`,
                      background: sector.gradient || sector.color,
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }}
                  ></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Index Sentiment Score</span>
                  <span>Vol: {formatCurrency(sector.totalVolume)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill-down Section */}
      {selectedSectorData && (
        <section className="section stagger" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 40 }}>
          <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '2rem' }}>{selectedSectorData.icon}</span>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>
                    {selectedSectorData.name} Sentiment Constituents
                  </h2>
                  <p className="section-subtitle">
                    Underlying markets with their contribution metrics and current CLOB contract prices
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, padding: '12px 24px', background: 'var(--bg-layer-2)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>Weighted Index</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: selectedSectorData.color, fontFamily: 'var(--font-mono)' }}>
                  {formatPercent(selectedSectorData.index)}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 24 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>Total Sector Volume</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(selectedSectorData.totalVolume)}
                </div>
              </div>
            </div>
          </div>

          {/* Component Markets Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-layer-2)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-layer-3)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.8rem' }}>MARKET QUESTION</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.8rem', textAlign: 'right' }}>CONTRACT PRICE (YES)</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.8rem', textAlign: 'right' }}>VOLUME</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.8rem', textAlign: 'right' }}>WEIGHT IN INDEX</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.8rem', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSectorData.topMarkets?.map((market, idx) => {
                    // Calculate weight logic: log10(vol + 1) + 1
                    const rawVol = market.volume || 0;
                    const weight = Math.log10(rawVol + 1) + 1;
                    
                    // Simple weight visual percentage relative to others
                    const totalWeight = selectedSectorData.topMarkets.reduce((acc, m) => acc + Math.log10((m.volume || 0) + 1) + 1, 0);
                    const weightPercentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

                    return (
                      <tr key={market.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '18px 24px', maxWidth: 400 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {market.question}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            ID: {market.id ? truncate(market.id, 12) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: market.price > 0.65 ? 'var(--success)' : market.price < 0.35 ? 'var(--danger)' : 'var(--text-primary)'
                            }}
                          >
                            {formatPercent(market.price)}
                          </span>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {formatCurrency(market.volume)}
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {weightPercentage.toFixed(1)}%
                            </span>
                            <div style={{ width: 60, height: 4, background: 'var(--bg-layer-3)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${weightPercentage}%`, background: selectedSectorData.color, borderRadius: 2 }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <a
                              href={`https://polymarket.com/event/${market.slug || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Trade <ArrowUpRight size={12} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Sector Correlation Insights */}
      <section className="section stagger" style={{ marginTop: 60 }}>
        <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.75rem' }}>🧠</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                How Sector Indices Work
              </h3>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Traditional prediction markets are siloed. Pollapse aggregates hundreds of active markets into weighted indices
                using **Logarithmic Volume Scaling**. By applying <code>log10(volume + 1) + 1</code> as each market&apos;s weight,
                we prevent massive volume outliers (like the US Presidential election) from totally drowning out the signal
                of dozens of highly predictive sub-markets. The result is a highly representative, responsive index for tracking macro sentiment shifts.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
