'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CorrelationGraph from '@/components/CorrelationGraph';
import HeatMap from '@/components/HeatMap';
import { formatCurrency, formatPercent, truncate, getSectorIcon } from '@/lib/utils';
import {
  ArrowLeft,
  Share2,
  SlidersHorizontal,
  Search,
  Maximize2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function CorrelationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'matrix'
  const [threshold, setThreshold] = useState(0.4);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  async function loadCorrelations() {
    try {
      const res = await fetch('/api/correlations?min=0.3&limit=55');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Error loading correlations:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCorrelations();
  }, []);

  // Handler for when a user clicks on a node in the D3 graph
  const handleNodeClick = (node) => {
    // Find correlation pairs for this node
    if (!data || !data.pairs) return;
    const related = data.pairs
      .filter(p => p.marketA === node.id || p.marketB === node.id)
      .map(p => {
        const isA = p.marketA === node.id;
        return {
          id: isA ? p.marketB : p.marketA,
          title: isA ? p.marketBTitle : p.marketATitle,
          correlation: p.correlation,
          price: isA ? p.marketBPrice : p.marketAPrice,
          sector: isA ? p.marketBSector : p.marketASector,
        };
      })
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 4);

    setSelectedNode({
      ...node,
      related,
    });
  };

  const handlePairSelect = (pair) => {
    // Select node A when clicked in Heatmap
    if (!data || !data.graph || !data.graph.nodes) return;
    const nodeA = data.graph.nodes.find(n => n.id === pair.marketA);
    if (nodeA) {
      handleNodeClick(nodeA);
    }
  };

  // Search node filter logic
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!data || !data.graph || !data.graph.nodes || searchQuery.trim().length === 0) return;

    const matched = data.graph.nodes.find(
      n => n.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      handleNodeClick(matched);
      setSearchQuery('');
    } else {
      alert('No matching market node found in current cluster.');
    }
  };

  const activeNodeInfo = hoveredNode || selectedNode;

  return (
    <div className="container page-content animate-fade-in">
      {/* Back to Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-blue">
            <Sparkles size={12} style={{ marginRight: 4 }} /> CORE INTELLIGENCE ARCHITECTURE
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Interactive <span className="highlight" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Correlation Web</span>
          </h1>
          <p className="section-subtitle">
            Force-directed clustering mapping Pearson correlation values between major predictive markets.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => setViewMode('graph')}
            className={`btn btn-sm ${viewMode === 'graph' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
          >
            Graph Web
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
          >
            Correlation Matrix
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-3" style={{ gap: 32, alignItems: 'flex-start' }}>
        {/* Left 2 Columns: D3 Canvas or HeatMap */}
        <div style={{ gridColumn: 'span 2' }}>
          {/* Controls Bar */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-layer-2)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px 12px 0 0',
              borderBottom: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SlidersHorizontal size={16} style={{ color: 'var(--text-dim)' }} />
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Min Correlation Edge Strength:
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  {threshold.toFixed(2)}
                </strong>
              </label>
              <input
                type="range"
                min="0.3"
                max="0.8"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>

            {/* Local Search node form */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', position: 'relative' }}>
              <input
                type="text"
                placeholder="Find node (e.g. Trump)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 36px 6px 12px',
                  background: 'var(--bg-layer-3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: 180,
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
            </form>
          </div>

          {/* D3 Canvas Wrap */}
          {loading ? (
            <div className="skeleton" style={{ height: 500, borderRadius: '0 0 12px 12px' }}></div>
          ) : viewMode === 'graph' ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              <CorrelationGraph
                graphData={data?.graph}
                onNodeHover={setHoveredNode}
                onNodeClick={handleNodeClick}
                threshold={threshold}
              />
            </div>
          ) : (
            <HeatMap graphData={data?.graph} onPairSelect={handlePairSelect} />
          )}
        </div>

        {/* Right 1 Column: Node Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Legend Details */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: 'var(--primary)' }} /> Network Statistics
            </h3>
            {loading ? (
              <div className="skeleton" style={{ height: 120 }}></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Markets Classified</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data?.stats?.marketsAnalyzed || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Strong Correlation Links (&gt;0.7)</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{data?.stats?.strongCorrelations || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Active Inefficiencies Diverged</span>
                  <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{data?.stats?.divergenceCount || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Node Inspector */}
          <div
            className="card"
            style={{
              padding: 28,
              background: 'var(--bg-layer-2)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: activeNodeInfo ? 'space-between' : 'center',
            }}
          >
            {activeNodeInfo ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 20 }}>
                {/* Node details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                      {getSectorIcon(activeNodeInfo.sector)} {activeNodeInfo.sector}
                    </span>
                    {hoveredNode && (
                      <span className="badge" style={{ background: 'var(--primary)15', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600 }}>
                        Hovered
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {activeNodeInfo.label}
                  </h3>

                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>YES Price</div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                        {formatPercent(activeNodeInfo.price)}
                      </span>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 2 }}>Volume</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {formatCurrency(activeNodeInfo.volume)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strongest Connections */}
                {activeNodeInfo.related && activeNodeInfo.related.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Strongest Associated Markets
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeNodeInfo.related.map((rel, idx) => {
                        const isPos = rel.correlation > 0;
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: 10,
                              background: 'var(--bg-layer-3)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                              {rel.title}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: isPos ? 'var(--success)' : 'var(--danger)' }}>
                              {isPos ? '+' : ''}
                              {formatPercent(rel.correlation)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Open Trade leg link */}
                <a
                  href={`https://polymarket.com/event/${activeNodeInfo.slug || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                  }}
                >
                  Trade this Market <ArrowUpRight size={14} />
                </a>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                <Info size={36} style={{ marginBottom: 12, color: 'var(--text-dim)', opacity: 0.6 }} />
                <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Inspector Workspace</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
                  Hover over or select any prediction market node to view its statistical correlations web.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
