'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatCurrency, formatPercent, truncate, getSectorIcon, getSectorColor, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  BarChart3,
  Percent
} from 'lucide-react';

export default function MarketDetailPage({ params }) {
  const { slug } = use(params);
  const [data, setData] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/markets/${slug}`);
        const json = await res.json();
        setData(json);

        // Load all correlations to find associated links
        const corrRes = await fetch('/api/correlations?min=0.3&limit=60');
        const corrJson = await corrRes.json();
        setCorrelations(corrJson);
      } catch (e) {
        console.error('Error loading market detail:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  const market = data?.market;
  const sector = data?.sector || 'other';
  const history = data?.history || [];

  // Filter correlations containing this market's ID
  const marketId = market?.id || market?.condition_id;
  const associatedPairs = correlations?.pairs
    ? correlations.pairs
        .filter(p => p.marketA === marketId || p.marketB === marketId)
        .map(p => {
          const isA = p.marketA === marketId;
          return {
            id: isA ? p.marketB : p.marketA,
            title: isA ? p.marketBTitle : p.marketATitle,
            correlation: p.correlation,
            price: isA ? p.marketBPrice : p.marketAPrice,
            sector: isA ? p.marketBSector : p.marketASector,
          };
        })
        .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
        .slice(0, 5)
    : [];

  const currentPrice = market
    ? market.outcomePrices
      ? parseFloat(JSON.parse(market.outcomePrices)[0])
      : market.bestBid
      ? parseFloat(market.bestBid)
      : 0.5
    : 0.5;

  const rawVol = market ? parseFloat(market.volume) || 0 : 0;

  // Simple SVG Line Chart generator
  const renderChart = () => {
    if (history.length < 2) {
      return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
          Not enough historical pricing coordinates.
        </div>
      );
    }

    const width = 600;
    const height = 250;
    const padding = 30;

    const prices = history.map(h => parseFloat(h.p));
    const maxP = Math.max(...prices, 1.0);
    const minP = Math.min(...prices, 0.0);

    const points = history.map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((parseFloat(h.p) - minP) / (Math.max(maxP - minP, 0.01))) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((level, idx) => {
          const y = height - padding - (level * (height - padding * 2));
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text
                x={padding - 6}
                y={y + 4}
                fill="var(--text-dim)"
                fontSize="9px"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {(level * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* The Line */}
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3.5}
          points={points}
          style={{ dropShadow: '0px 2px 10px rgba(59, 130, 246, 0.4)' }}
        />

        {/* Gradient fill area underneath line */}
        <path
          d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
          fill="url(#chartGrad)"
          opacity={0.12}
        />

        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="container page-content animate-fade-in">
      {/* Back Link */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/correlations" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Correlations Web
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="skeleton" style={{ height: 80, borderRadius: 16 }}></div>
          <div className="grid grid-3" style={{ gap: 32 }}>
            <div className="skeleton" style={{ height: 350, gridColumn: 'span 2', borderRadius: 16 }}></div>
            <div className="skeleton" style={{ height: 350, borderRadius: 16 }}></div>
          </div>
        </div>
      ) : !market ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <h3>Market Event Not Found</h3>
          <p style={{ color: 'var(--text-dim)' }}>We could not locate details for dynamic slug parameter: &quot;{slug}&quot;.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="stagger">
          {/* Main Top Header Block */}
          <div
            className="card"
            style={{
              padding: '32px 40px',
              background: 'var(--bg-layer-2)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            <div style={{ flexGrow: 1, maxWidth: '70%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className={`badge badge-blue`} style={{ background: `${getSectorColor(sector)}15`, color: getSectorColor(sector) }}>
                  {getSectorIcon(sector)} {sector.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Ends: {market.endDate ? formatDate(market.endDate) : '—'}
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {market.question}
              </h1>
            </div>

            {/* YES Price Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>Current YES Probability</div>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {formatPercent(currentPrice)}
                </div>
              </div>
              <a
                href={`https://polymarket.com/event/${market.slug || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                Trade on Polymarket <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Lower Grid Workspaces */}
          <div className="grid grid-3" style={{ gap: 32 }}>
            {/* Chart Area: Left 2 Columns */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} style={{ color: 'var(--primary)' }} /> Price Probability Timeline
                </h3>
                <div style={{ width: '100%', height: '260px' }}>
                  {renderChart()}
                </div>
              </div>

              {/* Description */}
              {market.description && (
                <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Market Specifications</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: market.description }}></p>
                </div>
              )}
            </div>

            {/* Sidebar Inspector: Correlations & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Financial Stats */}
              <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={16} style={{ color: 'var(--primary)' }} /> Leg Assessment
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Volume</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(rawVol)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Liquidity depth</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {market.liquidity ? formatCurrency(market.liquidity) : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Status</span>
                    <span style={{ fontWeight: 600, color: market.active ? 'var(--success)' : 'var(--text-dim)' }}>
                      {market.active ? 'ACTIVE' : 'RESOLVED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Correlation Pairs */}
              <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} style={{ color: 'var(--primary)' }} /> Correlation Dependencies
                </h3>

                {associatedPairs.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: 24, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                    No significant correlation pairs resolved for this market yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {associatedPairs.map((pair, idx) => {
                      const isPos = pair.correlation > 0;
                      return (
                        <Link href={`/market/${pair.id}`} key={idx} className="table-row-hover" style={{ display: 'block', textDecoration: 'none' }}>
                          <div
                            style={{
                              padding: 12,
                              background: 'var(--bg-layer-3)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                {pair.title}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {getSectorIcon(pair.sector)} {pair.sector}
                              </span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: isPos ? 'var(--success)' : 'var(--danger)' }}>
                              {isPos ? '+' : ''}
                              {formatPercent(pair.correlation)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
