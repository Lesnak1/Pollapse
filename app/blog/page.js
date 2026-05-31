'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  Terminal, 
  Layers, 
  Coins, 
  Send,
  Zap,
  Info
} from 'lucide-react';

export default function BlogPage() {
  const [filter, setFilter] = useState('all');

  const posts = [
    {
      id: 'strategic-trio',
      date: 'May 31, 2026',
      title: 'The Strategic Trio Upgrade: LP Control Room, Delta-Neutral Modeler, & Developer Webhooks',
      subtitle: 'Unlocking browser-local limit execution, directional arbitrage planners, and event-driven Webhook sandboxes.',
      excerpt: 'Introducing our biggest institutional upgrade yet. We are proud to deploy a three-pronged expansion suite to move Pollapse beyond observation and into active, secure strategic execution.',
      category: 'updates',
      categoryLabel: '⚡ Major Update',
      badgeClass: 'badge-amber',
      readTime: '7 min read',
      author: 'Leknax',
      icon: <Sparkles size={20} style={{ color: '#f59e0b' }} />,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.08) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      highlights: [
        '⚡ LP Control Room: Automated signing and local encryption for CLOB limit orders.',
        '⚖️ Delta-Neutral Arbitrage Planner: Proportional allocation and statistical convergence forecasting.',
        '📡 Developer Webhook Hub: Destination URL management and live test sandbox console.'
      ],
      link: '/docs'
    },
    {
      id: 'lp-farm-telegram',
      date: 'May 30, 2026',
      title: 'Active Liquidity Farming & Real-Time Telegram Broadcast Bot',
      subtitle: 'Tracking daily pools, cushion walls, and dispatching real-time signals directly to your chat widget.',
      excerpt: 'We have launched the LP Farm Screener, a dedicated dashboard mapping Polymarket daily rewards, competitive yield ratios, and cushion bid-ask depths, synchronized with our new Telegram floating broadcast alert widget.',
      category: 'features',
      categoryLabel: '📊 LP Farming',
      badgeClass: 'badge-purple',
      readTime: '5 min read',
      author: 'Leknax',
      icon: <Coins size={20} style={{ color: '#8b5cf6' }} />,
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.22)',
      highlights: [
        '📊 Cushion Wall Metric: Computes buy-side size protection inside limit order books.',
        '🌾 Competitive Yield Ratios: Direct daily reward-to-liquidity estimations.',
        '💬 Telegram Floating Alerts: Interactive signal broadcasts pushed directly to your viewport.'
      ],
      link: '/lp-farm'
    },
    {
      id: 'terminal-launch',
      date: 'May 30, 2026',
      title: 'Introducing Pollapse V1: The Cross-Market Intelligence Terminal',
      subtitle: 'Uncovering hidden correlation physics and price divergences across Polymarket contracts.',
      excerpt: 'Welcome to the mathematical layer of prediction markets. Today we launch Pollapse V1, introducing hardware-accelerated correlation webs, sector-wide indices gauges, and active divergence scanning.',
      category: 'launch',
      categoryLabel: '🚀 Launch',
      badgeClass: 'badge-success',
      readTime: '4 min read',
      author: 'Leknax',
      icon: <Layers size={20} style={{ color: '#10b981' }} />,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.22)',
      highlights: [
        '🕸️ Pearson Correlation Web: Interactive physics graph connecting adjacent contracts.',
        '📈 Log-Volume Indices: Fair sentiment gauges suppressive of volume distortions.',
        '📡 Real-Time Divergence Scanner: Active tracking of price drift between linked events.'
      ],
      link: '/correlations'
    }
  ];

  const filteredPosts = posts.filter(post => filter === 'all' || post.category === filter);

  return (
    <div className="container page-content animate-fade-in">
      {/* Back to Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Hero Section */}
      <section className="hero" style={{ padding: '48px 0 28px' }}>
        <div className="hero-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
          POLLAPSE CHRONOLOGY & DEVELOPMENT LOGGER
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.75rem', marginTop: 12, marginBottom: 16 }}>
          Algorithmic Logbook & <br />
          <span className="highlight" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Platform Advancements</span>
        </h1>
        <p className="hero-description" style={{ maxWidth: '800px', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Track our mathematical milestones, core updates, and feature integrations. Discover how the Pollapse ecosystem is scaling from a Cross-Market analytical tool to a comprehensive, fully-automated trading workspace.
        </p>
      </section>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 12, paddingBottom: 16, marginBottom: 40, overflowX: 'auto' }}>
        {[
          { id: 'all', label: '📰 All Chronicles' },
          { id: 'updates', label: '⚡ Update Logs' },
          { id: 'features', label: '🌾 LP Farming' },
          { id: 'launch', label: '🚀 Protocol Launches' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`btn btn-sm ${filter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Blog Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {filteredPosts.map((post, idx) => {
          // If the post is the Featured post (the latest strategic update on top) and no category filter is active, make it wide
          const isFeatured = post.id === 'strategic-trio' && filter === 'all';

          return (
            <div
              key={post.id}
              className="card animate-slide-up animate-delay-1"
              style={{
                padding: isFeatured ? '40px 48px' : '32px',
                background: 'var(--bg-layer-2)',
                border: isFeatured ? post.border : '1px solid var(--border-color)',
                borderRadius: 18,
                transition: 'all 0.25s ease-in-out',
                boxShadow: isFeatured ? '0 10px 40px rgba(245,158,11,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              {/* Meta row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${post.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    {post.icon} {post.categoryLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {post.date}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> {post.author}
                  </span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {post.readTime}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 style={{ 
                  fontSize: isFeatured ? '1.85rem' : '1.35rem', 
                  fontWeight: 800, 
                  margin: '0 0 10px 0', 
                  color: 'var(--text-primary)',
                  lineHeight: 1.3
                }}>
                  {post.title}
                </h2>
                <p style={{ 
                  margin: 0, 
                  fontSize: isFeatured ? '1rem' : '0.9rem', 
                  fontWeight: 500, 
                  color: isFeatured ? 'var(--warning)' : 'var(--text-secondary)',
                  lineHeight: 1.5 
                }}>
                  {post.subtitle}
                </p>
              </div>

              {/* Content body */}
              <div className="grid grid-12" style={{ gap: 24, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <div className={isFeatured ? 'col-span-7' : 'col-span-12'} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {post.excerpt}
                  </p>
                  <Link 
                    href={post.link}
                    className="btn btn-secondary btn-sm"
                    style={{ 
                      alignSelf: 'flex-start', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: '0.75rem',
                      marginTop: 8
                    }}
                  >
                    Explore Dashboard Tool <ArrowUpRight size={14} />
                  </Link>
                </div>

                {isFeatured && (
                  <div className="col-span-5" style={{ 
                    padding: 20, 
                    background: post.gradient,
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', letterSpacing: 0.8 }}>
                      Key Milestone Highlights
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {post.highlights.map((highlight, idx) => (
                        <li key={idx}>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Callout */}
      <div className="card" style={{ 
        marginTop: 56, 
        padding: 32, 
        background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(139,92,246,0.03) 100%)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 16,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
      }}>
        <Zap size={24} style={{ color: 'var(--primary)' }} />
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Want live updates directly inside your build terminal?
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: 640, lineHeight: 1.5 }}>
            Subscribe to our developer webhook feeds or correlation changes inside the **Developer Webhook Sandbox** to programmatically trigger alerts for your external setups.
          </p>
        </div>
        <Link href="/docs" className="btn btn-primary btn-sm" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>
          Configure Webhook Alerts
        </Link>
      </div>
    </div>
  );
}
