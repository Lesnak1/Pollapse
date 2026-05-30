'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatPercent, formatCurrency, getSectorColor } from '@/lib/utils';

export default function CorrelationGraph({ graphData, onNodeHover, onNodeClick, threshold }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', '100%')
      .style('background', '#030407')
      .style('border-radius', '16px')
      .style('border', '1px solid var(--border-color)');

    // 1. Add definitions (Gradients and Grid Pattern) - REMOVED heavy Gaussian Blur filters for 60fps GPU performance
    const defs = svg.append('defs');

    // Hardware-accelerated Grid Pattern
    defs.append('pattern')
      .attr('id', 'graph-grid')
      .attr('width', '40')
      .attr('height', '40')
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.015)')
      .attr('stroke-width', '1');

    // Radial Gradients for Sector Glowing Nodes (Uses hardware opacity blending instead of heavy SVG filters)
    const sectors = {
      politics: { color: '#3b82f6', glow: '#1d4ed8' },
      crypto: { color: '#f59e0b', glow: '#b45309' },
      geopolitics: { color: '#ef4444', glow: '#b91c1c' },
      economics: { color: '#10b981', glow: '#047857' },
      tech: { color: '#8b5cf6', glow: '#6d28d9' },
      sports: { color: '#06b6d4', glow: '#0e7490' },
      other: { color: '#64748b', glow: '#475569' }
    };

    Object.entries(sectors).forEach(([key, sec]) => {
      const grad = defs.append('radialGradient')
        .attr('id', `grad-${key}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
      
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', sec.color);
      
      grad.append('stop')
        .attr('offset', '75%')
        .attr('stop-color', sec.glow)
        .attr('stop-opacity', '0.85');

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#030407')
        .attr('stop-opacity', '1');
    });

    // Draw Grid Background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#graph-grid)')
      .style('pointer-events', 'none');

    // Container group for zooming
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Filter links based on current threshold
    const filteredLinks = graphData.links.filter(d => Math.abs(d.correlation) >= threshold);
    
    // Find active nodes that have at least one filtered link
    const activeNodeIds = new Set();
    filteredLinks.forEach(l => {
      activeNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
      activeNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
    });

    // Filter nodes
    const filteredNodes = activeNodeIds.size === 0 
      ? graphData.nodes 
      : graphData.nodes.filter(n => activeNodeIds.has(n.id));

    // Force simulation - Optimized to cool down rapidly using alphaMin(0.04) to save CPU
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(10, Math.log10(d.volume + 1) * 3) + 15))
      .alphaMin(0.04); // Force stop calculations quickly once nodes settle

    // Render Edges
    const linkGroup = container.append('g');

    // High-performance double-layered edge: 
    // Outer semi-transparent layer for hardware-accelerated glowing aura (replaces heavy SVG filters)
    const linkGlow = linkGroup.selectAll('.link-glow')
      .data(filteredLinks)
      .join('line')
      .attr('class', 'link-glow')
      .attr('stroke', d => d.correlation > 0 ? '#10b981' : '#ef4444')
      .attr('stroke-width', d => Math.max(2, d.value * 7))
      .attr('stroke-opacity', 0.08)
      .style('pointer-events', 'none');

    // Crisp core pathway line
    const link = linkGroup.selectAll('.link-core')
      .data(filteredLinks)
      .join('line')
      .attr('id', d => `link-${d.source.id || d.source}-${d.target.id || d.target}`)
      .attr('class', 'link-core')
      .attr('stroke', d => d.correlation > 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)')
      .attr('stroke-width', d => Math.max(1, d.value * 2.5))
      .style('pointer-events', 'none');

    // Render Node Groups
    const node = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(drag(simulation));

    // Glow aura circle that fades in on hover (uses hardware opacity instead of heavy blur filters)
    const nodeGlows = node.append('circle')
      .attr('r', d => Math.max(10, Math.log10(d.volume + 1) * 3) + 6)
      .attr('fill', d => sectors[d.sector]?.color || '#64748b')
      .attr('opacity', 0)
      .style('pointer-events', 'none')
      .attr('class', 'node-glow');

    // Draw Main Node Circles
    node.append('circle')
      .attr('r', d => Math.max(9, Math.log10(d.volume + 1) * 3))
      .attr('fill', d => `url(#grad-${d.sector || 'other'})`)
      .attr('stroke', d => sectors[d.sector]?.color || '#64748b')
      .attr('stroke-width', 1.5);

    // Pulse circles for giant nodes
    node.filter(d => d.volume > 1000000)
      .append('circle')
      .attr('r', d => Math.max(9, Math.log10(d.volume + 1) * 3) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => sectors[d.sector]?.color || '#64748b')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 1)
      .style('stroke-dasharray', '3,3');

    // Clean, readable label tags - Hide low-volume labels by default to prevent overlapping clutters
    const labels = node.append('text')
      .text(d => d.label.length > 22 ? d.label.slice(0, 19) + '…' : d.label)
      .attr('x', 0)
      .attr('y', d => Math.max(9, Math.log10(d.volume + 1) * 3) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-weight', '600')
      .attr('fill', '#94a3b8')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.95)')
      .style('opacity', d => d.volume > 250000 ? 0.75 : 0);

    // Interactivity triggers
    node.on('mouseover', (event, d) => {
      onNodeHover(d);
      
      const current = d3.select(event.currentTarget);

      // Fade-in outer glow circle (hardware blended opacity)
      current.select('.node-glow')
        .transition()
        .duration(150)
        .attr('opacity', 0.15);

      // Enlarge node stroke
      current.select('circle')
        .transition()
        .duration(150)
        .attr('r', Math.max(9, Math.log10(d.volume + 1) * 3) + 3)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      // Force show node label on hover with glowing white text
      current.select('text')
        .transition()
        .duration(150)
        .style('opacity', 1)
        .attr('fill', '#ffffff')
        .attr('font-size', '9.5px');

      // PERFORMANCE OPTIMIZATION: Only animate the pathways connected to the hovered node!
      // This reduces active animated strokes from 60+ down to just 3-4, keeping GPU load at 0%!
      link.filter(l => l.source.id === d.id || l.target.id === d.id)
        .style('stroke', d => d.correlation > 0 ? '#10b981' : '#ef4444')
        .style('stroke-opacity', 0.95)
        .attr('stroke-width', d => Math.max(2, d.value * 3.5))
        .style('stroke-dasharray', '5,5')
        .style('animation', 'flow 1.5s linear infinite');

      // Make outer glowing lines thicker and more visible for hovered connections
      linkGlow.filter(l => l.source.id === d.id || l.target.id === d.id)
        .style('stroke-opacity', 0.25);
    });

    node.on('mouseout', (event, d) => {
      onNodeHover(null);

      const current = d3.select(event.currentTarget);

      // Remove glow
      current.select('.node-glow')
        .transition()
        .duration(150)
        .attr('opacity', 0);

      // Restore sizes
      current.select('circle')
        .transition()
        .duration(150)
        .attr('r', Math.max(9, Math.log10(d.volume + 1) * 3))
        .attr('stroke', sectors[d.sector]?.color || '#64748b')
        .attr('stroke-width', 1.5);

      // Restore labels
      current.select('text')
        .transition()
        .duration(150)
        .style('opacity', d.volume > 250000 ? 0.75 : 0)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px');

      // PERFORMANCE OPTIMIZATION: Turn off animation streams for pathways when not hovered
      link.filter(l => l.source.id === d.id || l.target.id === d.id)
        .style('stroke', d => d.correlation > 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)')
        .style('stroke-opacity', 1)
        .attr('stroke-width', d => Math.max(1, d.value * 2.5))
        .style('stroke-dasharray', 'none')
        .style('animation', 'none');

      linkGlow.filter(l => l.source.id === d.id || l.target.id === d.id)
        .style('stroke-opacity', 0.08);
    });

    node.on('click', (event, d) => {
      onNodeClick(d);
    });

    // Update coordinates on tick
    simulation.on('tick', () => {
      linkGlow
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag behavior definition
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [graphData, threshold]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>
      
      {/* Dynamic Key Legend */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: 'rgba(3, 4, 7, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Sector node color key
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></span> Politics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span> Crypto
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span> Geopolitics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Economics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}></span> Tech
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }}></span> Sports
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          background: 'rgba(3, 4, 7, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        }}
      >
        Scroll to Zoom · Drag to Move Physics
      </div>
    </div>
  );
}
