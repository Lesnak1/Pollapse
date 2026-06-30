/**
 * Pollapse utility functions
 * Formatting, colors, and helpers
 */

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return '$0';
  const num = Number(value);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  if (value == null) return '0%';
  return `${(Number(value) * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value == null) return '0';
  const num = Number(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatProbability(price: number | string | null | undefined): string {
  if (price == null) return '—';
  return `${(Number(price) * 100).toFixed(1)}%`;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface SectorInfo {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  keywords: string[];
  tags: string[];
}

// Sector definitions
export const SECTORS: Record<string, SectorInfo> = {
  politics: {
    name: 'Politics',
    icon: '🏛️',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    keywords: ['election', 'president', 'trump', 'biden', 'democrat', 'republican', 'senate', 'congress', 'governor', 'vote', 'poll', 'political', 'party', 'primary', 'cabinet', 'impeach', 'veto', 'legislation', 'nominee', 'campaign'],
    tags: ['politics', 'elections', 'us-politics', 'government'],
  },
  crypto: {
    name: 'Crypto',
    icon: '₿',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    keywords: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'sol', 'blockchain', 'defi', 'token', 'coin', 'nft', 'web3', 'binance', 'coinbase', 'altcoin', 'stablecoin'],
    tags: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum'],
  },
  geopolitics: {
    name: 'Geopolitics',
    icon: '🌍',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    keywords: ['war', 'russia', 'ukraine', 'china', 'taiwan', 'nato', 'sanction', 'tariff', 'trade war', 'missile', 'nuclear', 'conflict', 'ceasefire', 'peace', 'invasion', 'military', 'iran', 'north korea', 'diplomacy'],
    tags: ['geopolitics', 'world', 'international', 'conflict'],
  },
  economics: {
    name: 'Economics',
    icon: '📈',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    keywords: ['gdp', 'inflation', 'interest rate', 'fed', 'federal reserve', 'recession', 'unemployment', 'jobs', 'cpi', 'stock', 'market', 's&p', 'dow', 'nasdaq', 'economy', 'debt', 'deficit', 'treasury', 'yield'],
    tags: ['economics', 'finance', 'markets', 'economy'],
  },
  tech: {
    name: 'Tech',
    icon: '🤖',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    keywords: ['ai', 'artificial intelligence', 'openai', 'chatgpt', 'google', 'apple', 'microsoft', 'meta', 'tesla', 'spacex', 'launch', 'iphone', 'android', 'startup', 'ipo', 'tech', 'software', 'semiconductor', 'chip', 'nvidia'],
    tags: ['tech', 'technology', 'ai', 'science'],
  },
  sports: {
    name: 'Sports',
    icon: '⚽',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    keywords: ['nba', 'nfl', 'mlb', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'f1', 'formula', 'ufc', 'boxing', 'championship', 'super bowl', 'world cup', 'finals', 'playoff', 'mvp'],
    tags: ['sports', 'nba', 'nfl', 'mlb', 'soccer', 'mma'],
  },
};

export interface MarketDataInput {
  question?: string;
  description?: string;
  tags?: (string | { slug?: string; label?: string })[];
}

export function classifyMarket(market: MarketDataInput): string {
  const text = `${market.question || ''} ${market.description || ''} ${(market.tags || []).map(t => typeof t === 'string' ? t : t.slug || t.label || '').join(' ')}`.toLowerCase();
  const marketTags = (market.tags || []).map(t => (typeof t === 'string' ? t : t.slug || t.label || '').toLowerCase());

  let bestSector = 'other';
  let bestScore = 0;

  for (const [sectorKey, sector] of Object.entries(SECTORS)) {
    let score = 0;
    // Check keywords
    for (const kw of sector.keywords) {
      if (text.includes(kw)) score += 1;
    }
    // Check tags (weighted higher)
    for (const tag of sector.tags) {
      if (marketTags.some(mt => mt.includes(tag))) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSector = sectorKey;
    }
  }

  return bestScore > 0 ? bestSector : 'other';
}

export function getSectorColor(sector: string): string {
  return SECTORS[sector]?.color || '#64748b';
}

export function getSectorIcon(sector: string): string {
  return SECTORS[sector]?.icon || '📊';
}

export function getSectorGradient(sector: string): string {
  return SECTORS[sector]?.gradient || 'linear-gradient(135deg, #475569, #64748b)';
}

export interface MarketSlugInput {
  slug?: string;
  market_slug?: string;
}

export function generatePolymarketUrl(market: MarketSlugInput): string {
  const slug = market.slug || market.market_slug || '';
  if (slug) return `https://polymarket.com/event/${slug}`;
  return `https://polymarket.com`;
}

export function generateTradeUrl(market: MarketSlugInput, _side = 'buy'): string {
  return generatePolymarketUrl(market);
}

export function getCorrelationColor(value: number): string {
  if (value > 0.7) return '#10b981';
  if (value > 0.4) return '#34d399';
  if (value > 0) return '#6ee7b7';
  if (value > -0.4) return '#fca5a5';
  if (value > -0.7) return '#f87171';
  return '#ef4444';
}

export interface DivergenceSeverity {
  level: 'extreme' | 'significant' | 'mild';
  color: string;
  label: string;
  emoji: string;
}

export function getDivergenceSeverity(magnitude: number): DivergenceSeverity {
  if (magnitude >= 0.10) return { level: 'extreme', color: '#ef4444', label: 'Extreme', emoji: '🔴' };
  if (magnitude >= 0.05) return { level: 'significant', color: '#f59e0b', label: 'Significant', emoji: '🟠' };
  return { level: 'mild', color: '#eab308', label: 'Mild', emoji: '🟡' };
}

export function truncate(str: string | null | undefined, maxLen = 60): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
