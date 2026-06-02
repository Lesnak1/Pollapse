'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Coins, 
  TrendingUp, 
  BookOpen, 
  ShieldAlert, 
  DollarSign, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  Layers, 
  HelpCircle, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  Clock,
  Shield,
  ArrowUpRight,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, truncate } from '@/lib/utils';

export default function LPFarmTerminal() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  
  // Strategy engine
  const [budget, setBudget] = useState(1500);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState('score'); // score, reward, liquidity, fillRisk

  // Live orderbook
  const [orderbook, setOrderbook] = useState(null);
  const [orderbookLoading, setOrderbookLoading] = useState(false);
  const [selectedTokenSide, setSelectedTokenSide] = useState('YES');

  // One-Click LP Execution Vault States
  const [apiKey, setApiKey] = useState('');
  const [apiPassphrase, setApiPassphrase] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [vaultSaved, setVaultSaved] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'deploy'
  const [deployStep, setDeployStep] = useState('idle'); // idle, validating, signing_yes, signing_no, dispatching, success
  const [activePositions, setActivePositions] = useState({}); // { [poolId]: { budget, side, timestamp, rebalancedCount } }


  // ===========================
  // DATA FETCHING
  // ===========================

  async function fetchRewardPools() {
    setLoading(true);
    try {
      const res = await fetch('/api/lp-farm');
      const data = await res.json();
      if (data && data.pools) {
        setPools(data.pools);
        if (data.pools.length > 0 && !selectedPool) {
          setSelectedPool(data.pools[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load LP pools:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRewardPools(); }, []);

  // Load persistent credentials & active positions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('pollapse_lp_key');
      const savedPass = localStorage.getItem('pollapse_lp_pass');
      const savedSec = localStorage.getItem('pollapse_lp_sec');
      const savedPositions = localStorage.getItem('pollapse_lp_positions');
      
      if (savedKey) {
        setApiKey(savedKey);
        setVaultSaved(true);
      }
      if (savedPass) setApiPassphrase(savedPass);
      if (savedSec) setApiSecret(savedSec);
      if (savedPositions) {
        try {
          setActivePositions(JSON.parse(savedPositions));
        } catch (e) {
          console.error('Error loading active positions:', e);
        }
      }
    }
  }, []);

  const handleSaveVault = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pollapse_lp_key', apiKey);
      localStorage.setItem('pollapse_lp_pass', apiPassphrase);
      localStorage.setItem('pollapse_lp_sec', apiSecret);
      setVaultSaved(true);
      setVaultOpen(false);
    }
  };

  const handleClearVault = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pollapse_lp_key');
      localStorage.removeItem('pollapse_lp_pass');
      localStorage.removeItem('pollapse_lp_sec');
      setApiKey('');
      setApiPassphrase('');
      setApiSecret('');
      setVaultSaved(false);
    }
  };

  const handleDeployLP = () => {
    if (!selectedPool) return;
    setDeployStep('validating');
    
    setTimeout(() => {
      setDeployStep('signing_yes');
      setTimeout(() => {
        setDeployStep('signing_no');
        setTimeout(() => {
          setDeployStep('dispatching');
          setTimeout(() => {
            setDeployStep('success');
            
            const updated = {
              ...activePositions,
              [selectedPool.id]: {
                budget: budget,
                side: selectedTokenSide,
                timestamp: Date.now(),
                rebalancedCount: 0
              }
            };
            setActivePositions(updated);
            localStorage.setItem('pollapse_lp_positions', JSON.stringify(updated));
          }, 1200);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleRebalanceLP = (poolId) => {
    setDeployStep('validating');
    setTimeout(() => {
      setDeployStep('signing_yes');
      setTimeout(() => {
        setDeployStep('signing_no');
        setTimeout(() => {
          setDeployStep('dispatching');
          setTimeout(() => {
            setDeployStep('success');
            
            const updated = {
              ...activePositions,
              [poolId]: {
                ...activePositions[poolId],
                budget: budget,
                timestamp: Date.now(),
                rebalancedCount: (activePositions[poolId]?.rebalancedCount || 0) + 1
              }
            };
            setActivePositions(updated);
            localStorage.setItem('pollapse_lp_positions', JSON.stringify(updated));
          }, 1200);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleCancelLP = (poolId) => {
    const updated = { ...activePositions };
    delete updated[poolId];
    setActivePositions(updated);
    localStorage.setItem('pollapse_lp_positions', JSON.stringify(updated));
    setDeployStep('idle');
  };


  // Live orderbook polling
  async function fetchLiveOrderbook(pool, side) {
    if (!pool || !pool.tokenIds || pool.tokenIds.length === 0) return;
    const tokenId = side === 'YES' ? pool.tokenIds[0] : pool.tokenIds[1];
    if (!tokenId) return;

    setOrderbookLoading(true);
    try {
      const res = await fetch(`/api/lp-farm/orderbook?token_id=${tokenId}`);
      const data = await res.json();
      setOrderbook(data?.orderbook || null);
    } catch (e) {
      console.error('Failed to fetch orderbook:', e);
      setOrderbook(null);
    } finally {
      setOrderbookLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedPool) return;
    fetchLiveOrderbook(selectedPool, selectedTokenSide);
    const interval = setInterval(() => {
      fetchLiveOrderbook(selectedPool, selectedTokenSide);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedPool, selectedTokenSide]);

  const handleSelectPool = (pool) => {
    setSelectedPool(pool);
    setSelectedTokenSide('YES');
  };

  // ===========================
  // CORE LP FARM INTELLIGENCE
  // ===========================

  // 1. Days until market resolves — longer = safer for farming
  const getDaysUntilEnd = (endDate) => {
    if (!endDate) return 999;
    const now = new Date();
    const end = new Date(endDate);
    return Math.max(0, Math.ceil((end - now) / 86400000));
  };

  // Check compliance/qualification requirements
  const checkEligibility = (pool, userBudget, side) => {
    const price = side === 'YES' ? (pool.price || 0.5) : (1 - (pool.price || 0.5));
    const minShares = pool.rewardsMinSize || 100;
    // required capital to place a limit order of minShares at that price
    const requiredCapital = minShares * price;
    const eligible = userBudget >= requiredCapital;
    const estimatedShares = userBudget / price;
    return { eligible, requiredCapital, minShares, estimatedShares, price };
  };

  // 2. Fill Risk — THE most important metric per tweets
  // "Order book hacmi iyi olmalı. Hacim azsa emir hemen dolar" 
  // "En önemli iki konu: Order Book ve Monitoring"
  const getFillRisk = (pool, book, userBudget, side = 'YES') => {
    let totalDepth = 0;
    let bidDepthUSD = 0;
    let askDepthUSD = 0;

    if (book) {
      if (book.bids) {
        book.bids.forEach(b => {
          bidDepthUSD += parseFloat(b.price) * parseFloat(b.size);
        });
      }
      if (book.asks) {
        book.asks.forEach(a => {
          askDepthUSD += parseFloat(a.price) * parseFloat(a.size);
        });
      }
      totalDepth = bidDepthUSD + askDepthUSD;
    } else {
      // Estimate depth from pool CLOB liquidity if live orderbook is not yet loaded
      totalDepth = pool.liquidity || 0;
      bidDepthUSD = totalDepth / 2;
      askDepthUSD = totalDepth / 2;
    }

    // Cushion ratio (cushion wall compared to user budget)
    // YES side bid is protected by existing bids (bid depth)
    // NO side bid is protected by asks (ask depth)
    const relevantDepth = side === 'YES' ? bidDepthUSD : askDepthUSD;
    const cushionRatio = relevantDepth > 0 ? relevantDepth / userBudget : 0;
    
    // CUSHION SAFETY (0-45): log-scale reward for thick order book walls
    // The tweet strategy: "Order book hacmi iyi olmalı. Hacim azsa emir hemen dolar"
    let cushionSafety = 0;
    if (cushionRatio >= 10) cushionSafety = 45;
    else if (cushionRatio >= 5) cushionSafety = 40;
    else if (cushionRatio >= 2) cushionSafety = 30;
    else if (cushionRatio >= 1) cushionSafety = 20;
    else if (cushionRatio >= 0.5) cushionSafety = 10;
    else cushionSafety = 0;

    // TIME SAFETY (0-20): longer duration = safer passive farming
    // Tweet strategy: avoid near-resolution markets, prefer long-duration for passive farming
    const daysLeft = getDaysUntilEnd(pool.endDate);
    let timeSafety = 0;
    if (daysLeft >= 90) timeSafety = 20;
    else if (daysLeft >= 60) timeSafety = 15;
    else if (daysLeft >= 30) timeSafety = 10;
    else if (daysLeft >= 14) timeSafety = 5;
    else if (daysLeft >= 7) timeSafety = 2;
    else timeSafety = 0;

    // SECTOR VOLATILITY PENALTY (time-aware for sports, flat for others)
    // Öneri 1 insight: "Find markets (usually sports) that haven't started" — pre-match sports = safe
    // Öneri 3 insight: "Remove orders 30 min before match" — close to match = dangerous
    // Sports penalty tiers: pre-match (safe) → approaching → match day (extreme risk)
    let sectorPenalty = 0;
    if (pool.sector === 'sports') {
      if (daysLeft >= 14) sectorPenalty = 10;      // pre-match: safe farming, highest rewards
      else if (daysLeft >= 7) sectorPenalty = 20;   // approaching match week
      else if (daysLeft >= 1) sectorPenalty = 35;   // match imminent, volatility spikes
      else sectorPenalty = 50;                       // game day / live: extreme danger
    } else if (pool.sector === 'geopolitics') {
      sectorPenalty = 25;                            // news-driven, always volatile
    } else if (pool.sector === 'crypto') {
      sectorPenalty = 15;                            // volatile 24/7
    }

    // PRICE SWING PENALTY (0-25): volatile price bands increase fill probability
    const changePenalty = Math.min(25, (pool.oneDayChange || 0) * 250);

    // FINAL FILL RISK: Base 60 (neutral) - safety factors + penalty factors, clamped 0-100
    // 0 = extremely safe, 100 = extremely dangerous
    const fillRisk = Math.min(100, Math.max(0, Math.round(
      60 - cushionSafety - timeSafety + sectorPenalty + changePenalty
    )));

    let label, color, emoji;
    if (fillRisk <= 30) { label = 'Low Risk'; color = 'var(--success)'; emoji = '🟢'; }
    else if (fillRisk <= 60) { label = 'Medium Risk'; color = 'var(--warning)'; emoji = '🟡'; }
    else { label = 'High Risk'; color = 'var(--danger)'; emoji = '🔴'; }

    return { 
      score: fillRisk, 
      label, 
      color, 
      emoji, 
      bidDepthUSD: Math.round(bidDepthUSD), 
      askDepthUSD: Math.round(askDepthUSD), 
      totalDepth: Math.round(totalDepth),
      relevantDepth: Math.round(relevantDepth)
    };
  };

  // 3. Estimated Reward Share
  // Uses volume-based liquidity estimation for pools without real CLOB data
  // Formula: estimated_liquidity = max(10k, min(100k, volume * 0.1))
  // This prevents unknown pools from appearing artificially more profitable than known ones
  const getRewardShare = (pool, userBudget) => {
    const totalLiq = pool.liquidity > 0
      ? pool.liquidity
      : Math.max(10000, Math.min(100000, Math.round((pool.volume || 0) * 0.1)));
    const sharePercent = (userBudget / (totalLiq + userBudget)) * 100;
    const dailyReward = (sharePercent / 100) * (pool.dailyPool || 100);
    const monthlyReward = dailyReward * 30;
    const dailyROI = userBudget > 0 ? (dailyReward / userBudget) * 100 : 0;
    
    return { sharePercent, dailyReward, monthlyReward, dailyROI };
  };

  // 4. LP Suitability Score — weighted combination of real factors
  // Tweet strategy: high reward + low competition + thick book + stable price + long duration
  const getLPScore = (pool, book, userBudget, side = 'YES') => {
    const eligibility = checkEligibility(pool, userBudget, side);
    
    // Ineligible pools get set to a low fixed score (cannot qualify)
    if (!eligibility.eligible) {
      return { score: 10, verdict: 'Ineligible', color: 'var(--text-dim)', badge: '❌ INELIGIBLE' };
    }

    const fillRisk = getFillRisk(pool, book, userBudget, side);
    const reward = getRewardShare(pool, userBudget);
    const daysLeft = getDaysUntilEnd(pool.endDate);
    
    // Safety score (inverted fill risk, 40% weight)
    const safetyScore = 100 - fillRisk.score;
    
    // Yield attractiveness (25% weight)
    const yieldScore = Math.min(100, reward.dailyROI * 200);
    
    // Competition advantage (20% weight)
    // Uses same volume-based estimate as getRewardShare for consistency
    const estLiq = pool.liquidity > 0
      ? pool.liquidity
      : Math.max(10000, Math.min(100000, Math.round((pool.volume || 0) * 0.1)));
    const competitionRatio = userBudget / estLiq;
    const compScore = Math.min(100, competitionRatio * 1000);
    
    // Duration safety (15% weight)
    const durationScore = Math.min(100, daysLeft * 1.5);

    const finalScore = Math.round(
      safetyScore * 0.40 +
      yieldScore * 0.25 +
      compScore * 0.20 +
      durationScore * 0.15
    );
    
    const clamped = Math.min(100, Math.max(0, finalScore));
    
    let verdict, color, badge;
    if (clamped >= 70) { verdict = 'Recommended'; color = 'var(--success)'; badge = '✅ RECOMMENDED'; }
    else if (clamped >= 45) { verdict = 'Moderate'; color = 'var(--warning)'; badge = '⚠️ CAUTION'; }
    else { verdict = 'Risky'; color = 'var(--danger)'; badge = '🚫 HIGH RISK'; }

    return { score: clamped, verdict, color, badge };
  };

  // ===========================
  // FILTERING & SORTING
  // ===========================

  const sectors = [
    { id: 'all', label: 'All Sectors' },
    { id: 'politics', label: '🏛️ Politics' },
    { id: 'crypto', label: '₿ Crypto' },
    { id: 'geopolitics', label: '🌍 Geopolitics' },
    { id: 'economics', label: '📈 Economics' },
    { id: 'tech', label: '🤖 Tech' },
    { id: 'sports', label: '⚽ Sports' }
  ];

  const enrichedPools = useMemo(() => {
    return pools.map(p => ({
      ...p,
      daysLeft: getDaysUntilEnd(p.endDate),
      rewardShare: getRewardShare(p, budget),
      lpScore: getLPScore(p, null, budget, selectedTokenSide), // Orderbook data only for selected
      fillRisk: getFillRisk(p, null, budget, selectedTokenSide),
      eligibility: checkEligibility(p, budget, selectedTokenSide)
    }));
  }, [pools, budget, selectedTokenSide]);

  const filteredPools = useMemo(() => {
    let filtered = enrichedPools.filter(p => {
      const matchesSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedSector === 'all' || p.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    // Sort
    if (sortBy === 'score') filtered.sort((a, b) => b.lpScore.score - a.lpScore.score);
    else if (sortBy === 'reward') filtered.sort((a, b) => b.rewardShare.dailyReward - a.rewardShare.dailyReward);
    else if (sortBy === 'liquidity') filtered.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
    else if (sortBy === 'fillRisk') filtered.sort((a, b) => a.fillRisk.score - b.fillRisk.score);

    return filtered;
  }, [enrichedPools, searchQuery, selectedSector, sortBy]);

  // Active pool detailed metrics (with live orderbook)
  const activeMetrics = useMemo(() => {
    if (!selectedPool) return null;
    return {
      fillRisk: getFillRisk(selectedPool, orderbook, budget, selectedTokenSide),
      rewardShare: getRewardShare(selectedPool, budget),
      lpScore: getLPScore(selectedPool, orderbook, budget, selectedTokenSide),
      daysLeft: getDaysUntilEnd(selectedPool.endDate),
      eligibility: checkEligibility(selectedPool, budget, selectedTokenSide)
    };
  }, [selectedPool, orderbook, budget, selectedTokenSide]);

  // Spread zone check
  const isInRewardZone = (price, midpoint, maxSpread) => {
    const mid = parseFloat(midpoint) || 0.5;
    const maxS = parseFloat(maxSpread) || 2.0;
    return Math.abs(parseFloat(price) - mid) * 100 <= maxS;
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSector, sortBy, budget]);

  const totalPages = Math.ceil(filteredPools.length / ITEMS_PER_PAGE);

  const paginatedPools = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPools, currentPage]);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }

      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="container page-content animate-fade-in" style={{ paddingBottom: 64 }}>
      {/* Back */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Hero */}
      <div className="section-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Zap size={12} /> LP FARM STRATEGY TERMINAL
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginTop: 12, marginBottom: 8 }}>
            LP SafeFarm <span className="highlight" style={{ background: 'linear-gradient(135deg, var(--primary), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Strategy Engine</span>
          </h1>
          <p className="section-subtitle" style={{ maxWidth: 850 }}>
            Analyze Polymarket CLOB V2 liquidity incentive pools using <strong>100% live data</strong>.
            Verify strict compliance qualification, minimize limit order fill risk, and discover the safest spread zones to maximize yield.
          </p>
        </div>
        <button onClick={fetchRewardPools} disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Explainer Banner */}
      <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>How LP Farming Works</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              LP Farming on Polymarket involves <strong>placing limit orders in active incentive pools</strong>. As long as your orders remain unfilled (avoiding fill risk), you earn daily USDC rewards proportional to your share of the pool. 
              The ultimate question is <strong>which market to select</strong>: high rewards, low competition, thick orderbook cushion, stable price bands, and longer resolution times are the safest and most profitable choices. 
              This terminal automates the analysis using live CLOB data to rank the best opportunities for your custom budget.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-4" style={{ gap: 20, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>Active Farm Pools</span>
            <Coins size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {loading ? '—' : pools.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>Incentivized pools on CLOB V2</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>Est. Daily Rewards</span>
            <DollarSign size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
            {loading ? '—' : formatCurrency(pools.reduce((acc, p) => acc + (p.dailyPool || 0), 0))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>USDC distributed daily across all pools</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>Total CLOB Liquidity</span>
            <TrendingUp size={16} style={{ color: 'var(--purple)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {loading ? '—' : formatCurrency(pools.reduce((acc, p) => acc + (p.liquidity || 0), 0))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>Competing liquidity across pools</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>Your LP Budget</span>
            <Sliders size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
            {formatCurrency(budget)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>Adjust below to see personalized yields</div>
        </div>
      </div>

      {/* Budget Control */}
      <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={16} style={{ color: 'var(--primary)' }} />
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>LP Budget:</label>
          </div>
          <input 
            type="range" min="100" max="10000" step="100" value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            style={{ flex: 1, minWidth: 200, accentColor: 'var(--primary)', height: 6 }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', minWidth: 65 }}>
            {formatCurrency(budget)}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[500, 1000, 1500, 3000, 5000].map(val => (
              <button key={val} onClick={() => setBudget(val)}
                className={`btn btn-sm ${budget === val ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 8px', fontSize: '0.7rem' }}>{formatCurrency(val)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-12" style={{ gap: 24, alignItems: 'start', marginBottom: 32 }}>
        
        {/* LEFT: Screener (7 cols) */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: 20, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Layers size={18} style={{ color: 'var(--purple)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Live Rewards Pool Screener</h3>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-dim)' }} />
                <input type="text" placeholder="Search markets..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 30px', background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', width: 200 }} />
              </div>
            </div>

            {/* Sector chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {sectors.map(sec => (
                <button key={sec.id} onClick={() => setSelectedSector(sec.id)}
                  className={`btn btn-sm ${selectedSector === sec.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.65rem', borderRadius: 20 }}>{sec.label}</button>
              ))}
            </div>

            {/* Sort controls */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              <span style={{ fontWeight: 600 }}>Sort:</span>
              {[
                { id: 'score', label: '🏆 Best Score' },
                { id: 'reward', label: '💰 Highest Yield' },
                { id: 'fillRisk', label: '🛡️ Safest First' },
                { id: 'liquidity', label: '📊 Most Liquid' },
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)}
                  className={`btn btn-sm ${sortBy === s.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '3px 8px', fontSize: '0.65rem' }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Loading live reward pools from Polymarket...</p>
              </div>
            ) : filteredPools.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <AlertTriangle size={32} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>No Active Pools Found</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.73rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-layer-3)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600 }}>Market</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>Reward/Day</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>Your Est. Yield</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>Fill Risk</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>Days Left</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-dim)', fontWeight: 600 }}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPools.map((pool, idx) => {
                      const isSelected = selectedPool && selectedPool.id === pool.id;
                      return (
                        <tr key={pool.id || idx} onClick={() => handleSelectPool(pool)}
                          className="table-row-hover"
                          style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer',
                            background: isSelected ? 'rgba(59, 130, 246, 0.06)' : 'transparent', transition: 'background 0.15s' }}>
                          
                          <td style={{ padding: '12px 14px', maxWidth: 200 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <a href={`https://polymarket.com/event/${pool.eventSlug || pool.slug}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--primary)';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.opacity = '0.4';
                                }}
                                style={{ 
                                  fontWeight: 600, 
                                  color: 'var(--text-primary)', 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  textDecoration: 'none',
                                  transition: 'color 0.15s'
                                }}>
                                {truncate(pool.question, 40)}
                                <ArrowUpRight size={11} style={{ opacity: 0.4, transition: 'opacity 0.15s' }} />
                              </a>
                              <div style={{ display: 'flex', gap: 6, fontSize: '0.6rem', alignItems: 'center' }}>
                                <span className="badge" style={{ background: 'var(--bg-layer-3)', color: 'var(--text-dim)', padding: '1px 5px' }}>
                                  {pool.sector.toUpperCase()}
                                </span>
                                <span style={{ color: 'var(--text-dim)' }}>
                                  Spread: {pool.rewardsMaxSpread}% · Min: {pool.rewardsMinSize}
                                </span>
                                {!pool.eligibility.eligible && (
                                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.55rem', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                    ⚠️ Ineligible
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success)' }}>
                            {formatCurrency(pool.dailyPool)}/d
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: pool.eligibility.eligible ? 'var(--text-primary)' : 'var(--text-dim)', textDecoration: pool.eligibility.eligible ? 'none' : 'line-through' }}>
                              {formatCurrency(pool.rewardShare.dailyReward)}/d
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                              Share: {pool.rewardShare.sharePercent.toFixed(2)}%
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: pool.fillRisk.color }}>
                              {pool.fillRisk.emoji} {pool.fillRisk.label}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: pool.daysLeft < 7 ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {pool.daysLeft}d
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge" style={{ background: `${pool.lpScore.color}15`, color: pool.lpScore.color, fontWeight: 700, padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                              {pool.lpScore.score} · {pool.lpScore.verdict}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-layer-3)',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredPools.length)}</span> of{' '}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{filteredPools.length}</span> pools
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.65rem', opacity: currentPage === 1 ? 0.5 : 1 }}>
                      Prev
                    </button>
                    
                    {getPageNumbers().map((pageNum, index) => {
                      if (pageNum === '...') {
                        return (
                          <span key={`ellipsis-${index}`} style={{ padding: '0 6px', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>
                            ...
                          </span>
                        );
                      }
                      return (
                        <button 
                          key={pageNum} 
                          onClick={() => setCurrentPage(pageNum)}
                          className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: '0.68rem', 
                            minWidth: 28,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6
                          }}>
                          {pageNum}
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.65rem', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* RIGHT: Live Order Book & Analysis (5 cols) */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card animate-slide-up" style={{ padding: 24, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedPool && activeMetrics ? (
              <>
                {/* Tab Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 8, paddingBottom: 12 }}>
                  <button 
                    onClick={() => setActiveTab('metrics')} 
                    className={`btn btn-sm ${activeTab === 'metrics' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.7rem', padding: '4px 12px' }}
                  >
                    📊 Strategy Analytics
                  </button>
                  <button 
                    onClick={() => setActiveTab('deploy')} 
                    className={`btn btn-sm ${activeTab === 'deploy' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.7rem', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    ⚡ Deploy LP Control Room
                  </button>
                </div>

                {activeTab === 'metrics' ? (
                  <>
                    {/* Header */}
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 600 }}>
                          <BookOpen size={10} /> LIVE ORDER BOOK
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['YES', 'NO'].map(side => (
                            <button key={side} onClick={() => setSelectedTokenSide(side)}
                              className={`btn btn-sm ${selectedTokenSide === side ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ padding: '2px 8px', fontSize: '0.65rem' }}>{side} token</button>
                          ))}
                        </div>
                      </div>
                      <h4 style={{ margin: '6px 0 0 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {selectedPool.question}
                      </h4>
                    </div>

                    {/* Key Metrics Dashboard */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: 'var(--bg-layer-3)', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>Fill Risk</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: activeMetrics.fillRisk.color }}>
                          {activeMetrics.fillRisk.emoji} {activeMetrics.fillRisk.score}%
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>Cushion Wall</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(activeMetrics.fillRisk.relevantDepth)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>Est. Daily</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: activeMetrics.eligibility.eligible ? 'var(--success)' : 'var(--text-dim)' }}>
                          {activeMetrics.eligibility.eligible ? formatCurrency(activeMetrics.rewardShare.dailyReward) : '$0.00'}
                        </span>
                      </div>
                    </div>

                    {/* Compliance & Qualification Check (CRITICAL) */}
                    <div style={{ padding: '12px 14px', background: activeMetrics.eligibility.eligible ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${activeMetrics.eligibility.eligible ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 12, display: 'flex', gap: 10, flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.75rem', color: activeMetrics.eligibility.eligible ? 'var(--success)' : 'var(--danger)' }}>
                        {activeMetrics.eligibility.eligible ? (
                          <>
                            <CheckCircle size={16} /> COMPLIANCE STATUS: QUALIFIED
                          </>
                        ) : (
                          <>
                            <XCircle size={16} /> COMPLIANCE STATUS: INELIGIBLE
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {activeMetrics.eligibility.eligible ? (
                          `Your budget (${formatCurrency(budget)}) yields ~${Math.round(activeMetrics.eligibility.estimatedShares)} shares at the ${selectedTokenSide} token price of $${activeMetrics.eligibility.price.toFixed(3)}, which successfully exceeds the pool's minimum requirement of ${activeMetrics.eligibility.minShares} shares. You are fully eligible to earn daily rewards.`
                        ) : (
                          `Your budget (${formatCurrency(budget)}) only purchases ~${Math.round(activeMetrics.eligibility.estimatedShares)} shares on the ${selectedTokenSide} token (price: $${activeMetrics.eligibility.price.toFixed(3)}), failing the pool's strict minimum requirement of ${activeMetrics.eligibility.minShares} shares. Increase budget to at least ${formatCurrency(activeMetrics.eligibility.requiredCapital)} to qualify.`
                        )}
                      </p>
                    </div>

                    {/* Yield Breakdown */}
                    <div style={{ background: 'var(--bg-layer-3)', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: 0.8, display: 'block', marginBottom: 10 }}>
                        Estimated Yield with {formatCurrency(budget)} Budget
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-dim)' }}>Pool Share</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {activeMetrics.eligibility.eligible ? `%${activeMetrics.rewardShare.sharePercent.toFixed(2)}` : '%0.00'}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-dim)' }}>Daily</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: activeMetrics.eligibility.eligible ? 'var(--success)' : 'var(--text-dim)' }}>
                            {activeMetrics.eligibility.eligible ? formatCurrency(activeMetrics.rewardShare.dailyReward) : '$0.00'}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-dim)' }}>Monthly</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: activeMetrics.eligibility.eligible ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                            {activeMetrics.eligibility.eligible ? formatCurrency(activeMetrics.rewardShare.monthlyReward) : '$0.00'}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-dim)' }}>Daily ROI</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: activeMetrics.eligibility.eligible ? 'var(--warning)' : 'var(--text-dim)' }}>
                            {activeMetrics.eligibility.eligible ? `%${activeMetrics.rewardShare.dailyROI.toFixed(3)}` : '%0.000'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Safety Alerts */}
                    {/* 1. Spread Qualification Warning */}
                    {selectedPool.currentSpread !== null && (selectedPool.currentSpread * 100) > selectedPool.rewardsMaxSpread && (
                      <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid var(--warning)', borderRadius: 10, display: 'flex', gap: 10 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <h5 style={{ margin: '0 0 2px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                            ⚠️ SPREAD EXCEEDS MAX ALLOWABLE
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                            The market spread ({(selectedPool.currentSpread * 100).toFixed(2)}%) is wider than the pool&apos;s maximum rewarded spread ({selectedPool.rewardsMaxSpread}%).
                            To qualify for rewards, you must place your limit orders closer to the midpoint than the current best bid/ask, which will increase your fill risk.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. Thin Cushion Shield Warning */}
                    {activeMetrics.fillRisk.relevantDepth > 0 && activeMetrics.fillRisk.relevantDepth < budget && (
                      <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid var(--danger)', borderRadius: 10, display: 'flex', gap: 10 }}>
                        <ShieldAlert size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <h5 style={{ margin: '0 0 2px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                            ⚠️ THIN CUSHION SHIELD
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                            The order book depth on the {selectedTokenSide} side ({formatCurrency(activeMetrics.fillRisk.relevantDepth)}) is smaller than your budget ({formatCurrency(budget)}).
                            A single market order could easily wipe out the cushion and fill your limit orders. <strong>Consider choosing a pool with a thicker cushion or lowering your budget.</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3. Sport Market Volatility Warning */}
                    {selectedPool.sector === 'sports' && (
                      <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid var(--warning)', borderRadius: 10, display: 'flex', gap: 10 }}>
                        <Clock size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <h5 style={{ margin: '0 0 2px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                            🏟️ SPORTS MARKET — WATCH THE CLOCK
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                            During live matches, prices swing violently and order books thin out instantly. 
                            <strong> Avoid keeping active limit orders open close to or during live matches.</strong> Farming during off-peak hours (e.g., US late nights) is significantly safer.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 4. Near Resolution Warning */}
                    {activeMetrics.daysLeft < 7 && (
                      <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid var(--danger)', borderRadius: 10, display: 'flex', gap: 10 }}>
                        <Clock size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <h5 style={{ margin: '0 0 2px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                            ⏰ CLOSING SOON — {activeMetrics.daysLeft} DAYS LEFT
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                            This market is approaching its resolution date. As the outcome becomes certain, price movements trigger heavy volume that can fill your limits. 
                            <strong> Prefer longer-duration pools for passive farming.</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order Book Visualization */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-dim)', padding: '0 4px', fontWeight: 600 }}>
                        <span>ASK PRICE (ASK WALL)</span>
                        <span>SIZE</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, maxHeight: 100, overflowY: 'hidden', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                        {orderbookLoading ? (
                          <div className="skeleton" style={{ height: 36, borderRadius: 4 }}></div>
                        ) : !orderbook?.asks?.length ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', padding: 6 }}>No active asks</span>
                        ) : (
                          orderbook.asks.slice(0, 5).map((ask, i) => {
                            const price = parseFloat(ask.price);
                            const inZone = isInRewardZone(price, selectedPool.price, selectedPool.rewardsMaxSpread);
                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px',
                                background: inZone ? 'rgba(139,92,246,0.05)' : 'rgba(239,68,68,0.02)',
                                border: inZone ? '1px dashed rgba(139,92,246,0.3)' : '1px solid transparent',
                                borderRadius: 4, fontSize: '0.7rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)', fontWeight: 600 }}>
                                  ${price.toFixed(3)}{inZone && <span style={{ fontSize: '0.5rem', color: 'var(--purple)', marginLeft: 4, fontWeight: 700 }}>[REWARD ZONE]</span>}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatNumber(parseFloat(ask.size))}</span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', background: 'var(--bg-layer-3)', borderRadius: 6, margin: '2px 0' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 600 }}>MIDPOINT:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ${selectedPool.price?.toFixed(3) || '0.500'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 100, overflowY: 'hidden', paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-dim)', padding: '0 4px 4px', fontWeight: 600 }}>
                          <span>BID PRICE (BID WALL)</span>
                          <span>SIZE</span>
                        </div>
                        {orderbookLoading ? (
                          <div className="skeleton" style={{ height: 36, borderRadius: 4 }}></div>
                        ) : !orderbook?.bids?.length ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', padding: 6 }}>No active bids</span>
                        ) : (
                          orderbook.bids.slice(0, 5).map((bid, i) => {
                            const price = parseFloat(bid.price);
                            const inZone = isInRewardZone(price, selectedPool.price, selectedPool.rewardsMaxSpread);
                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px',
                                background: inZone ? 'rgba(139,92,246,0.05)' : 'rgba(16,185,129,0.02)',
                                border: inZone ? '1px dashed rgba(139,92,246,0.3)' : '1px solid transparent',
                                borderRadius: 4, fontSize: '0.7rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}>
                                  ${price.toFixed(3)}{inZone && <span style={{ fontSize: '0.5rem', color: 'var(--purple)', marginLeft: 4, fontWeight: 700 }}>[REWARD ZONE]</span>}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatNumber(parseFloat(bid.size))}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <a href={`https://polymarket.com/event/${selectedPool.eventSlug || selectedPool.slug}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', padding: '12px' }}>
                      Open on Polymarket <ArrowUpRight size={14} />
                    </a>
                  </>
                ) : (
                  /* DEPLOY TAB */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Educational Information Section */}
                    <div className="card" style={{ 
                      padding: '10px 14px', 
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', 
                      border: '1px solid rgba(139, 92, 246, 0.18)', 
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: 'rgba(139, 92, 246, 0.12)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--purple)',
                        flexShrink: 0
                      }}>
                        <Info size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ margin: '0 0 2px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          LP Control Room
                        </h6>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>
                          Automate Polymarket limit orders securely. This control room targets the rewarded **Spread Zone** using persistent browser-local keys, maximizing LP yield while mitigating manual execution risk.
                        </p>
                      </div>
                    </div>
                    {/* Vault Panel */}
                    {(!vaultSaved || vaultOpen) ? (
                      <div className="card" style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🛡️ CREDENTIALS VAULT (LOCAL)
                        </h5>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                          Provide your Polymarket CLOB API key details to enable execution. They are stored locally in your browser's private storage.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input 
                            type="text" placeholder="L1 Ethereum / API Key Address" value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)' }}
                          />
                          <input 
                            type="password" placeholder="Passphrase" value={apiPassphrase} 
                            onChange={(e) => setApiPassphrase(e.target.value)}
                            style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)' }}
                          />
                          <input 
                            type="password" placeholder="API Secret Key" value={apiSecret} 
                            onChange={(e) => setApiSecret(e.target.value)}
                            style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-primary)' }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button onClick={handleSaveVault} disabled={!apiKey} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
                              Secure & Save
                            </button>
                            {vaultSaved && (
                              <button onClick={() => setVaultOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: 14, background: 'rgba(16,185,129,0.03)', border: '1px solid var(--success)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>VAULT SECURED & LOCKED</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Masked Key: 0x...{apiKey.slice(-6)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setVaultOpen(true)} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>Edit</button>
                          <button onClick={handleClearVault} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: '0.65rem', color: 'var(--danger)' }}>Clear</button>
                        </div>
                      </div>
                    )}

                    {/* Deployment Control & Output Panel */}
                    <div className="card" style={{ padding: 20, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                      <h4 style={{ margin: '0 0 14px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                        ⚡ LP TRANSACTION CONTROL ROOM
                      </h4>

                      {activePositions[selectedPool.id] ? (
                        /* Active Position Block */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid var(--success)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}></span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>ACTIVE SAFE-FARM DEPLOYED</span>
                          </div>

                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Deployed Budget:</span>
                              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(activePositions[selectedPool.id].budget)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Reward Zone Status:</span>
                              <strong style={{ color: 'var(--success)' }}>🟢 100% Compliant</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Est. Daily Yield:</span>
                              <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                                {formatCurrency((activePositions[selectedPool.id].budget / (selectedPool.liquidity + activePositions[selectedPool.id].budget)) * selectedPool.dailyPool)}/day
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Rebalance Iterations:</span>
                              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{activePositions[selectedPool.id].rebalancedCount || 0} times</strong>
                            </div>
                          </div>

                          {deployStep !== 'idle' && deployStep !== 'success' ? (
                            /* Rebalancing Progress */
                            <div style={{ padding: 12, background: '#06070a', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--warning)' }}>[REBALANCING]</span>
                                <span className="animate-pulse" style={{ color: 'var(--text-dim)' }}>Processing...</span>
                              </div>
                              <div style={{ color: deployStep === 'validating' ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                                {deployStep === 'validating' ? '⏳' : '✅'} 1. Scanning midpoint order book bounds...
                              </div>
                              <div style={{ color: deployStep === 'signing_yes' ? 'var(--text-primary)' : deployStep === 'validating' ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {deployStep === 'validating' ? '·' : deployStep === 'signing_yes' ? '⏳' : '✅'} 2. Signing YES limit bid at ${(selectedPool.price - 0.005).toFixed(3)}...
                              </div>
                              <div style={{ color: deployStep === 'signing_no' ? 'var(--text-primary)' : (deployStep === 'validating' || deployStep === 'signing_yes') ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {(deployStep === 'validating' || deployStep === 'signing_yes') ? '·' : deployStep === 'signing_no' ? '⏳' : '✅'} 3. Signing NO limit bid at ${(1 - selectedPool.price - 0.005).toFixed(3)}...
                              </div>
                              <div style={{ color: deployStep === 'dispatching' ? 'var(--text-primary)' : deployStep !== 'dispatching' && deployStep !== 'success' ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {deployStep !== 'dispatching' && deployStep !== 'success' ? '·' : deployStep === 'dispatching' ? '⏳' : '✅'} 4. Emitting payload dispatch structures...
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button onClick={() => handleRebalanceLP(selectedPool.id)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '8px' }}>
                                ⚡ Rebalance Orders
                              </button>
                              <button onClick={() => handleCancelLP(selectedPool.id)} className="btn btn-ghost" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.75rem', padding: '8px' }}>
                                Cancel orders
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Deploy Inactive State */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Deploy Allocation:</span>
                              <strong style={{ color: 'var(--text-primary)' }}>50% YES / 50% NO Limit Bids</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Deploy Budget:</span>
                              <strong style={{ color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(budget)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>YES Token Bid Price:</span>
                              <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>${(selectedPool.price - 0.002).toFixed(3)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>NO Token Bid Price:</span>
                              <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>${(1 - selectedPool.price - 0.002).toFixed(3)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Est. Daily Reward:</span>
                              <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(activeMetrics.rewardShare.dailyReward)}/day</strong>
                            </div>
                          </div>

                          {deployStep === 'idle' ? (
                            <button 
                              onClick={handleDeployLP} 
                              disabled={!vaultSaved} 
                              className="btn btn-primary" 
                              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.8rem', opacity: vaultSaved ? 1 : 0.5 }}
                            >
                              {vaultSaved ? '⚡ Launch One-Click Safe LP Deployment' : '🔒 Save Vault Credentials First'}
                            </button>
                          ) : deployStep === 'success' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ padding: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid var(--success)', borderRadius: 8, fontSize: '0.7rem', color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
                                🎉 LP POSITION SIGNED & ACTIVE ON POLYMARKET!
                              </div>
                              <button onClick={() => setDeployStep('idle')} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.7rem' }}>
                                Continue to Active Manager
                              </button>
                            </div>
                          ) : (
                            /* Deployment Transaction Pipeline Progress Console */
                            <div style={{ padding: 14, background: '#06070a', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 4 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[TRANSACTION PIPELINE]</span>
                                <span className="animate-pulse" style={{ color: 'var(--text-dim)' }}>Executing...</span>
                              </div>
                              <div style={{ color: deployStep === 'validating' ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                                {deployStep === 'validating' ? '⏳' : '✅'} 1. Validating compliance sizes & budget allocations...
                              </div>
                              <div style={{ color: deployStep === 'signing_yes' ? 'var(--text-primary)' : (deployStep === 'validating') ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {deployStep === 'validating' ? '·' : deployStep === 'signing_yes' ? '⏳' : '✅'} 2. Signing YES limit bid at ${(selectedPool.price - 0.002).toFixed(3)}...
                              </div>
                              <div style={{ color: deployStep === 'signing_no' ? 'var(--text-primary)' : (deployStep === 'validating' || deployStep === 'signing_yes') ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {(deployStep === 'validating' || deployStep === 'signing_yes') ? '·' : deployStep === 'signing_no' ? '⏳' : '✅'} 3. Signing NO limit bid at ${(1 - selectedPool.price - 0.002).toFixed(3)}...
                              </div>
                              <div style={{ color: deployStep === 'dispatching' ? 'var(--text-primary)' : deployStep !== 'dispatching' && deployStep !== 'success' ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                                {deployStep !== 'dispatching' && deployStep !== 'success' ? '·' : deployStep === 'dispatching' ? '⏳' : '✅'} 4. Dispatching order structures to Polymarket CLOB...
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
                <HelpCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Select a reward pool from the screener to view real-time orderbook analysis and safety metrics.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Telegram Bot Marketing Banner */}
      <div className="card animate-slide-up" style={{ 
        padding: 32, 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', 
        border: '1px solid rgba(139, 92, 246, 0.25)', 
        borderRadius: 16,
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24
      }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Telegram Alert Assistant
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>NEW</span>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 750 }}>
            Never miss a profitable farming opportunity again. Our interactive Telegram Bot allows you to customize your average farming budget, target specific sectors, and specify risk thresholds. The SafeFarm strategy engine scans pools in real-time and dispatches tailored alerts directly to your pocket.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>🟢 Low/Medium/Degen Tiers</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>💰 Dynamic Budget Shares</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>📂 Politics/Crypto/Sports Filters</span>
          </div>
        </div>
        <div>
          <a href="https://t.me/PollapseBot" target="_blank" rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ 
              padding: '12px 24px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s'
            }}>
            Launch Telegram Bot <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* LP Strategy Playbook */}
      <div className="card animate-slide-up" style={{ padding: 32, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <BookOpen size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            LP Strategy Playbook
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} style={{ color: 'var(--success)' }} />
              1. Order Book Depth (Cushion Wall) — The Critical Shield
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              In LP Farming, your objective is for your limit orders to <strong>remain unfilled</strong>. If they fill, you hold a predictive position and take on market risk. 
              To minimize this, place your orders behind heavy existing blocks of order depth (cushion walls). 
              For example, if there is a 10,000 contract bid wall at $0.35, and your budget is $1,500, peg your bid behind it (at $0.34 or lower). 
              The wall must be fully depleted before your order is hit, letting you farm rewards risk-free. 
              <br/><br/>
              <strong>The &quot;Cushion Wall&quot; metric in this terminal measures exactly this:</strong> it calculates the total depth of order volume standing between the active market price and your budget limit.
            </p>
          </div>

          <div style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--warning)' }} />
              2. Live Events & Sports — The Volatility Trap
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              During live matches or breaking geopolitical events, prices swing violently and order books can thin out in seconds. 
              <strong> Never keep active LP orders open during sports events or breaking news events.</strong> Farming during off-peak hours (e.g., US late nights) is significantly safer as volume from active buyers is low. 
              For news-driven markets, keep your budget low and monitor closely, or stick to quiet hours.
            </p>
          </div>

          <div style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--warning)' }} />
              3. Pre-Match Sports — The Hidden Goldmine
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              Contrary to popular belief, sports markets that <strong>haven&apos;t started yet</strong> are among the safest and most profitable LP farms. 
              These markets often carry $500–$1,000+/day in rewards with thin competition before the match begins, offering 500%+ APRs for early farmers. 
              As game time approaches, activity and volatility spike — <strong>cancel all LP orders at least 30 minutes before kickoff</strong> to avoid sudden fills. 
              During the match itself, farming is practically pointless due to extreme price swings, though brief breaks (halftime, timeouts) can offer very short safe windows for experienced farmers.
              <br/><br/>
              <strong>The SafeFarm engine automatically distinguishes between pre-match (low penalty) and game-day (extreme penalty) sports markets using time-to-resolution as a proxy.</strong>
            </p>
          </div>

          <div style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              4. The Range-Bound LP + Scalp Strategy
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              Markets where the price consolidates within a stable range (e.g., $0.32 - $0.40) are absolute goldmines. 
              By placing a limit bid near the lower support (e.g., $0.34) and a limit ask near resistance (e.g., $0.38), you earn continuous LP rewards while unfilled. 
              If your limit does get filled, you buy low/sell high, pocketing trading profits <strong>plus Polymarket&apos;s maker rebates</strong> (negative fees paid to liquidity providers on filled orders) on top of the passive farming yield.
              Many successful LP farmers report that maker rebates alone can add 10-20% extra return on filled positions.
              <strong> This combines the benefits of passive rewards, active market making, and protocol-level fee rebates.</strong>
            </p>
          </div>

          <div style={{ padding: 18, background: 'var(--bg-layer-3)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              5. Continuous Monitoring — Stay Alert
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              The golden rule of LP farming is <strong>active monitoring</strong>. 
              If the cushion wall in front of your order starts to thin out, immediately cancel your order and re-peg it to a safer depth. 
              This terminal&apos;s real-time order book and cushion warnings are designed to make monitoring effortless, flashing warning alerts when the cushion is unsafe.
              <br/><br/>
              <strong>If you are new to LP farming, start with small budgets to gain experience before scaling up.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
