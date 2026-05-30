'use client';

import { useState } from 'react';
import { formatPercent, getSectorColor, truncate } from '@/lib/utils';
import { Info } from 'lucide-react';

export default function HeatMap({ graphData, onPairSelect }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
        No correlation matrix data available.
      </div>
    );
  }

  // Slice down to top 15 markets by volume to prevent rendering a giant unreadable 40x40 matrix
  const matrixNodes = [...graphData.nodes]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 15);

  // Helper to find correlation between two nodes from links
  const getCorrelation = (idA, idB) => {
    if (idA === idB) return 1.0;
    const link = graphData.links.find(
      l =>
        (l.source === idA && l.target === idB) ||
        (l.source === idB && l.target === idA) ||
        (l.source?.id === idA && l.target?.id === idB) ||
        (l.source?.id === idB && l.target?.id === idA)
    );
    return link ? link.correlation : 0;
  };

  // Helper to color cell based on correlation coefficient
  const getCellBg = (val) => {
    if (val === 1.0) return 'rgba(255, 255, 255, 0.15)';
    if (val > 0) {
      // Green
      return `rgba(16, 185, 129, ${val * 0.85})`;
    } else if (val < 0) {
      // Red
      return `rgba(239, 68, 68, ${Math.abs(val) * 0.85})`;
    }
    return 'rgba(255, 255, 255, 0.02)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      <div style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
        <Info size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          This matrix displays correlation coefficients between the top 15 highest-volume active markets. Green cells indicate positive correlation, and red indicates negative correlation. Hover/click for detail.
        </span>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, background: '#06070a', padding: 16 }}>
        <div style={{ minWidth: '700px' }}>
          {/* Heatmap Grid */}
          <table style={{ borderCollapse: 'separate', borderSpacing: 2, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 150, padding: 4 }}></th>
                {matrixNodes.map((node, idx) => (
                  <th
                    key={node.id}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--text-dim)',
                      textAlign: 'center',
                      verticalAlign: 'bottom',
                      height: 80,
                      transform: 'rotate(-30deg)',
                      whiteSpace: 'nowrap',
                      padding: '4px 8px',
                    }}
                  >
                    <span
                      style={{
                        borderLeft: `3px solid ${getSectorColor(node.sector)}`,
                        paddingLeft: 4,
                        display: 'inline-block',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {truncate(node.label, 15)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixNodes.map((rowNode, rowIdx) => (
                <tr key={rowNode.id}>
                  {/* Row headers */}
                  <td
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      paddingRight: 12,
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      borderLeft: `4px solid ${getSectorColor(rowNode.sector)}`,
                      paddingLeft: 8,
                    }}
                  >
                    {truncate(rowNode.label, 20)}
                  </td>
                  {matrixNodes.map((colNode, colIdx) => {
                    const val = getCorrelation(rowNode.id, colNode.id);
                    const isSelf = rowNode.id === colNode.id;

                    return (
                      <td
                        key={colNode.id}
                        onMouseEnter={() =>
                          setHoveredCell({
                            row: rowNode.label,
                            col: colNode.label,
                            val,
                            rowSec: rowNode.sector,
                            colSec: colNode.sector,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (!isSelf && val !== 0) {
                            onPairSelect({
                              marketA: rowNode.id,
                              marketB: colNode.id,
                              marketATitle: rowNode.label,
                              marketBTitle: colNode.label,
                              correlation: val,
                            });
                          }
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          background: getCellBg(val),
                          borderRadius: 4,
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: isSelf ? 'rgba(255,255,255,0.4)' : Math.abs(val) > 0.4 ? '#fff' : 'var(--text-dim)',
                          cursor: isSelf ? 'default' : 'pointer',
                          transition: 'transform 0.15s, filter 0.15s',
                        }}
                        className="interactive-cell"
                      >
                        {isSelf ? '1.0' : val !== 0 ? val.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip detail block */}
      {hoveredCell && (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-layer-2)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            fontSize: '0.8rem',
            lineHeight: 1.5,
          }}
          className="animate-fade-in"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pair Correlation Detail</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: hoveredCell.val > 0 ? 'var(--success)' : hoveredCell.val < 0 ? 'var(--danger)' : 'var(--text-dim)',
              }}
            >
              {hoveredCell.val === 1.0 ? '100% Identity' : formatPercent(hoveredCell.val)}
            </span>
          </div>
          <div style={{ color: 'var(--text-dim)' }}>
            <strong>X-Axis:</strong> {hoveredCell.row}{' '}
            <span style={{ fontSize: '0.7rem' }} className={`badge badge-muted`}>
              {hoveredCell.rowSec}
            </span>
          </div>
          <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>
            <strong>Y-Axis:</strong> {hoveredCell.col}{' '}
            <span style={{ fontSize: '0.7rem' }} className={`badge badge-muted`}>
              {hoveredCell.colSec}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
