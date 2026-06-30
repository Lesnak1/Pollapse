'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatPercent, truncate, getSectorIcon } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Share2,
  Save,
  Brain,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  X,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import ThesisExecutionModal from '@/components/ThesisExecutionModal';

export default function ThesisBuilderPage() {
  // Thesis state
  const [thesisName, setThesisName] = useState('My Macro Thesis');
  const [thesisItems, setThesisItems] = useState([]);
  const [savedTheses, setSavedTheses] = useState([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Correlation database for warnings
  const [correlations, setCorrelations] = useState(null);

  // Load correlation mapping to check for warnings
  useEffect(() => {
    async function loadCorrelations() {
      try {
        const res = await fetch('/api/correlations?min=0.3&limit=60');
        const json = await res.json();
        setCorrelations(json);
      } catch (e) {
        console.error('Error loading correlations:', e);
      }
    }
    loadCorrelations();

    // Load saved theses from local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pollapse_theses');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedTheses(parsed);
        } catch { /* fail silent */ }
      }
    }
  }, []);

  // Search effect
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/markets?search=${encodeURIComponent(searchQuery)}&limit=10`);
        const json = await res.json();
        setSearchResults(json.markets || []);
      } catch (e) {
        console.error('Error searching markets:', e);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addMarketToThesis = (market) => {
    // Prevent duplicates
    if (thesisItems.some(item => item.id === market.id)) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    setThesisItems([
      ...thesisItems,
      {
        id: market.id,
        question: market.question,
        slug: market.slug,
        eventSlug: market.eventSlug || market.slug || '',
        price: market.price || 0.5,
        prediction: 'YES', // default direction
        weight: 3, // default confidence weight (1-5)
        sector: market.sector,
        volume: market.volume,
        tokens: market.tokens || [],
        clobTokenIds: market.clobTokenIds || [],
      }
    ]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeMarketFromThesis = (id) => {
    setThesisItems(thesisItems.filter(item => item.id !== id));
  };

  const updateItemPrediction = (id, prediction) => {
    setThesisItems(
      thesisItems.map(item => (item.id === id ? { ...item, prediction } : item))
    );
  };

  const updateItemWeight = (id, weight) => {
    setThesisItems(
      thesisItems.map(item => (item.id === id ? { ...item, weight } : item))
    );
  };

  // Find correlation warnings between any selected markets
  const getCorrelationWarnings = () => {
    if (!correlations || !correlations.pairs || thesisItems.length < 2) return [];

    const warnings = [];
    const pairs = correlations.pairs;

    for (let i = 0; i < thesisItems.length; i++) {
      for (let j = i + 1; j < thesisItems.length; j++) {
        const itemA = thesisItems[i];
        const itemB = thesisItems[j];

        // Find correlation pair in either direction
        const matched = pairs.find(
          p =>
            (p.marketA === itemA.id && p.marketB === itemB.id) ||
            (p.marketA === itemB.id && p.marketB === itemA.id)
        );

        if (matched && Math.abs(matched.correlation) >= 0.6) {
          const isHighPositive = matched.correlation >= 0.6;
          const sameBet = itemA.prediction === itemB.prediction;

          // If they are highly positively correlated and user bets SAME direction
          // OR if they are highly negatively correlated and user bets OPPOSITE direction
          // That means they are highly concentrated (double exposure)
          const isConcentrated = (isHighPositive && sameBet) || (!isHighPositive && !sameBet);

          if (isConcentrated) {
            warnings.push({
              marketA: itemA.question,
              marketB: itemB.question,
              correlation: matched.correlation,
              type: 'concentration',
              msg: `High redundancy: These markets are ${formatPercent(matched.correlation)} correlated. Betting the same outcome concentrates your directional risk.`,
            });
          } else {
            warnings.push({
              marketA: itemA.question,
              marketB: itemB.question,
              correlation: matched.correlation,
              type: 'hedged',
              msg: `Hedged exposure: These markets are highly correlated, but you have opposite directional predictions. This acts as a partial hedge.`,
            });
          }
        }
      }
    }

    return warnings;
  };

  const warnings = getCorrelationWarnings();

  // Save thesis logic
  const handleSaveThesis = () => {
    if (thesisItems.length === 0) return;

    const newThesis = {
      id: Date.now().toString(),
      name: thesisName,
      items: thesisItems,
      createdAt: new Date().toISOString(),
    };

    const updated = [newThesis, ...savedTheses.filter(t => t.name !== thesisName)];
    setSavedTheses(updated);
    localStorage.setItem('pollapse_theses', JSON.stringify(updated));
    alert('Thesis saved successfully!');
  };

  const loadSavedThesis = (saved) => {
    setThesisName(saved.name);
    setThesisItems(saved.items);
  };

  const deleteSavedThesis = (id, e) => {
    e.stopPropagation();
    const updated = savedTheses.filter(t => t.id !== id);
    setSavedTheses(updated);
    localStorage.setItem('pollapse_theses', JSON.stringify(updated));
  };

  const handleExecuteThesis = () => {
    setShowExecutionModal(true);
  };

  // Calculate composite scoring index (weighted probabilities)
  const calculateCompositeScore = () => {
    if (thesisItems.length === 0) return 0.5;

    let totalWeight = 0;
    let weightedProbability = 0;

    thesisItems.forEach(item => {
      const prob = item.prediction === 'YES' ? item.price : 1 - item.price;
      weightedProbability += prob * item.weight;
      totalWeight += item.weight;
    });

    return totalWeight > 0 ? weightedProbability / totalWeight : 0.5;
  };

  const compositeScore = calculateCompositeScore();

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
          <span className="badge badge-purple">
            <Brain size={12} style={{ marginRight: 4 }} /> INTELLIGENCE SUITE
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            Multi-Market <span className="highlight" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thesis Builder</span>
          </h1>
          <p className="section-subtitle">
            Model complex geopolitical, economic, and crypto theses. Verify cross-market dependencies before executing.
          </p>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 32, alignItems: 'flex-start' }}>
        {/* Left 2 Columns: Builder Workspace */}
        <div className="col-span-2">
          <div className="card" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            {/* Thesis Details */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={thesisName}
                onChange={(e) => setThesisName(e.target.value)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  paddingBottom: 4,
                  outline: 'none',
                  flexGrow: 1,
                }}
              />
              <button
                onClick={handleSaveThesis}
                disabled={thesisItems.length === 0}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Save size={16} /> Save Thesis
              </button>
            </div>

            {/* Search Input for adding markets */}
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>
                Search Polymarket Events to add to Thesis
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Type 3+ characters to search markets... (e.g. Trump, Fed, Bitcoin)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-layer-3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Search Dropdown */}
              {showDropdown && searchQuery.trim().length >= 3 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'var(--bg-layer-3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 280,
                    overflowY: 'auto',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                >
                  {searching ? (
                    <div style={{ padding: 16, color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.85rem' }}>
                      Searching markets...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: 16, color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.85rem' }}>
                      No matching active markets found.
                    </div>
                  ) : (
                    searchResults.map(market => (
                      <div
                        key={market.id}
                        onClick={() => addMarketToThesis(market)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                        className="table-row-hover"
                      >
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {market.question}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {getSectorIcon(market.sector)} {market.sector} · Vol: {formatCurrency(market.volume)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                            {formatPercent(market.price)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* List of Current Thesis Items */}
            {thesisItems.length === 0 ? (
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
                <BookOpen size={40} style={{ marginBottom: 16, color: 'var(--text-dim)' }} />
                <h3 style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Thesis Workspace Empty</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Use the search bar above to select prediction markets and build your multi-legged trading thesis.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {thesisItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: 20,
                      background: 'var(--bg-layer-3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 20,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Left: market name */}
                    <div style={{ flexGrow: 1, minWidth: 250, maxWidth: '50%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
                          {getSectorIcon(item.sector)} {item.sector}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {item.question}
                      </h4>
                    </div>

                    {/* Middle: directional choices & allocations */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                      {/* Prediction direction */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 6, fontWeight: 500 }}>Your Prediction</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => updateItemPrediction(item.id, 'YES')}
                            className={`btn btn-sm ${item.prediction === 'YES' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 12px', minWidth: 50, background: item.prediction === 'YES' ? 'var(--success)' : '' }}
                          >
                            YES
                          </button>
                          <button
                            onClick={() => updateItemPrediction(item.id, 'NO')}
                            className={`btn btn-sm ${item.prediction === 'NO' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 12px', minWidth: 50, background: item.prediction === 'NO' ? 'var(--danger)' : '' }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Weight rating (1-5 stars) */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 6, fontWeight: 500 }}>Confidence Weight</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5].map(w => (
                            <button
                              key={w}
                              onClick={() => updateItemWeight(item.id, w)}
                              style={{
                                border: 'none',
                                background: 'none',
                                fontSize: '1rem',
                                color: w <= item.weight ? 'var(--warning)' : 'var(--text-dim)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current Contract Price */}
                      <div style={{ textAlign: 'right', minWidth: 70 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 4 }}>Contract Price</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {formatPercent(item.price)}
                        </div>
                      </div>
                    </div>

                    {/* Right: delete */}
                    <button
                      onClick={() => removeMarketFromThesis(item.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 8,
                        transition: 'color 0.2s',
                      }}
                      className="table-row-hover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Summary Panel & Saved Theses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Analysis & Composite Scoring Card */}
          <div
            className="card"
            style={{
              padding: 28,
              background: 'var(--bg-layer-2)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Thesis Assessment
            </h3>

            {/* Composite probability */}
            <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--bg-layer-3)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>Composite Sentiment Index</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                  {formatPercent(compositeScore)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Confidence-Weighted</span>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Shows the combined weighted likelihood of your thesis coming to fruition based on current prices.
              </p>
            </div>

            {/* Execution CTAs */}
            <button
              onClick={handleExecuteThesis}
              disabled={thesisItems.length === 0}
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 24px',
                marginBottom: 16,
              }}
            >
              <ExternalLink size={16} /> Execute Thesis Legs <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>({thesisItems.length})</span>
            </button>

            {/* Dependency Checker Section */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Cross-Market Dependency Warnings
              </h4>

              {thesisItems.length < 2 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: 12, background: 'var(--bg-layer-3)', borderRadius: 8, textAlign: 'center' }}>
                  Add at least 2 markets to scan for correlation overlaps.
                </div>
              ) : warnings.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.75rem',
                    color: 'var(--success)',
                    padding: '10px 14px',
                    background: 'var(--bg-layer-3)',
                    borderRadius: 8,
                    border: '1px solid var(--success)20',
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>Perfectly diversified thesis legs. No high correlation overlaps detected!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {warnings.map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        background: 'var(--bg-layer-3)',
                        borderLeft: `3px solid ${w.type === 'concentration' ? 'var(--danger)' : 'var(--success)'}`,
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4, color: w.type === 'concentration' ? 'var(--danger)' : 'var(--success)' }}>
                        <AlertTriangle size={14} />
                        <span>{w.type === 'concentration' ? 'Systemic Risk Overlap' : 'Hedged Overlap'}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{w.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Saved Theses Sidebar */}
          <div className="card" style={{ padding: 28, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck2 size={18} /> Saved Models
            </h3>

            {savedTheses.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: 24, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                No saved theses yet. Build one and save to list.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedTheses.map(saved => (
                  <div
                    key={saved.id}
                    onClick={() => loadSavedThesis(saved)}
                    style={{
                      padding: 12,
                      background: 'var(--bg-layer-3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    className="table-row-hover"
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {saved.name}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {saved.items?.length || 0} markets Leg
                      </span>
                    </div>
                    <button
                      onClick={(e) => deleteSavedThesis(saved.id, e)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showExecutionModal && (
        <ThesisExecutionModal
          thesisItems={thesisItems}
          thesisName={thesisName}
          onClose={() => setShowExecutionModal(false)}
        />
      )}
    </div>
  );
}
