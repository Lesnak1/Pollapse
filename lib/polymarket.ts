/**
 * Polymarket API Client
 * Handles all communication with Gamma API and CLOB API
 */
import cache from './cache';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 4): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// =========== TYPINGS ===========

export interface GammaEvent {
  id?: string | number;
  title?: string;
  slug?: string;
  description?: string;
  markets?: GammaMarket[];
}

export interface GammaToken {
  token_id: string;
  outcome: string;
  price?: number;
}

export interface GammaMarket {
  id?: string | number;
  condition_id: string;
  question: string;
  description?: string;
  slug?: string;
  market_slug?: string;
  clobTokenIds?: string | string[];
  outcomePrices?: string | string[];
  outcomes?: string[];
  tags?: (string | { slug?: string; label?: string })[];
  image?: string;
  icon?: string;
  liquidity?: string | number;
  liquidityClob?: string | number;
  bestBid?: string | number;
  bestAsk?: string | number;
  oneDayPriceChange?: string | number;
  end_date_iso?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  rewardsMinSize?: string | number;
  rewardsMaxSpread?: string | number;
  holdingRewardsEnabled?: boolean;
  feesEnabled?: boolean;
  lastTradePrice?: string | number;
  tokens?: GammaToken[];
  events?: { slug: string }[];
  eventSlug?: string;
  event_slug?: string;
  volume?: string | number;
  volumeNum?: string | number;
}

export interface CLOBMidpointResponse {
  mid?: number;
  [key: string]: any;
}

export interface CLOBOrderbookEntry {
  price: string;
  size: string;
}

export interface CLOBOrderbook {
  bids: CLOBOrderbookEntry[];
  asks: CLOBOrderbookEntry[];
  error?: string;
  [key: string]: any;
}

export interface PriceHistoryPoint {
  t: number; // timestamp
  p: number; // price
}

export interface PriceHistoryResponse {
  history: PriceHistoryPoint[];
  [key: string]: any;
}

// =========== GAMMA API (Market Discovery) ===========

export async function fetchEvents(params: Record<string, string> = {}): Promise<GammaEvent[]> {
  const cacheKey = `events:${JSON.stringify(params)}`;
  const cached = await cache.get<GammaEvent[]>(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({
    closed: 'false',
    limit: '100',
    active: 'true',
    ...params,
  });

  const data = await fetchWithRetry(`${GAMMA_API}/events?${query}`);
  await cache.set(cacheKey, data, 120000); // 2 min TTL
  return data;
}

export async function fetchMarkets(params: Record<string, string> = {}): Promise<GammaMarket[]> {
  const cacheKey = `markets:${JSON.stringify(params)}`;
  const cached = await cache.get<GammaMarket[]>(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({
    closed: 'false',
    limit: '100',
    active: 'true',
    ...params,
  });

  const data = await fetchWithRetry(`${GAMMA_API}/markets?${query}`);
  await cache.set(cacheKey, data, 120000);
  return data;
}

export async function fetchAllActiveMarkets(): Promise<GammaMarket[]> {
  const cacheKey = 'all-active-markets';
  const cached = await cache.get<GammaMarket[]>(cacheKey);
  if (cached) return cached;

  let allMarkets: GammaMarket[] = [];
  let offset = 0;
  const limit = 100;

  // Fetch up to 500 markets (5 pages)
  for (let i = 0; i < 5; i++) {
    try {
      const data = await fetchWithRetry(
        `${GAMMA_API}/markets?closed=false&active=true&limit=${limit}&offset=${offset}`
      );
      if (!data || data.length === 0) break;
      allMarkets = allMarkets.concat(data);
      if (data.length < limit) break;
      offset += limit;
    } catch (err: any) {
      console.error(`Error fetching markets page ${i}:`, err.message);
      break;
    }
  }

  await cache.set(cacheKey, allMarkets, 120000);
  return allMarkets;
}

export async function fetchEventBySlug(slug: string): Promise<GammaEvent> {
  const cacheKey = `event:${slug}`;
  const cached = await cache.get<GammaEvent>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${GAMMA_API}/events/slug/${slug}`);
  await cache.set(cacheKey, data, 60000);
  return data;
}

export async function fetchMarketBySlug(slug: string): Promise<GammaMarket | null> {
  const cacheKey = `market-slug:${slug}`;
  const cached = await cache.get<GammaMarket>(cacheKey);
  if (cached) return cached;

  // Try events first (most polymarket URLs use event slugs)
  try {
    const data = await fetchWithRetry(`${GAMMA_API}/events/slug/${slug}`);
    if (data) {
      await cache.set(cacheKey, data, 60000);
      return data;
    }
  } catch (e) {
    // fallback to market slug
  }

  const data = await fetchWithRetry(`${GAMMA_API}/markets/slug/${slug}`);
  await cache.set(cacheKey, data, 60000);
  return data;
}

export async function searchMarkets(query: string): Promise<GammaMarket[]> {
  const cacheKey = `search:${query}`;
  const cached = await cache.get<GammaMarket[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(
    `${GAMMA_API}/markets?closed=false&limit=20&${new URLSearchParams({ tag: query })}`
  );
  await cache.set(cacheKey, data, 60000);
  return data || [];
}

// =========== CLOB API (Prices & Orderbook) ===========

export async function fetchMidpoint(tokenId: string): Promise<CLOBMidpointResponse> {
  const cacheKey = `midpoint:${tokenId}`;
  const cached = await cache.get<CLOBMidpointResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${CLOB_API}/midpoint?token_id=${tokenId}`);
  await cache.set(cacheKey, data, 30000); // 30s TTL
  return data;
}

export async function fetchBatchMidpoints(tokenIds: string[]): Promise<Record<string, number | null>> {
  if (!tokenIds || tokenIds.length === 0) return {};
  const cacheKey = `batch-midpoints:${[...tokenIds].sort().join(',')}`;
  const cached = await cache.get<Record<string, number | null>>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry(`${CLOB_API}/midpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenIds),
    });
    await cache.set(cacheKey, data, 30000);
    return data;
  } catch {
    // Fallback: fetch individually
    const results: Record<string, number | null> = {};
    for (const id of tokenIds.slice(0, 20)) {
      try {
        const mid = await fetchMidpoint(id);
        results[id] = mid?.mid || null;
      } catch { /* skip */ }
    }
    return results;
  }
}

export async function fetchOrderbook(tokenId: string): Promise<CLOBOrderbook> {
  const cacheKey = `orderbook:${tokenId}`;
  const cached = await cache.get<CLOBOrderbook>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${CLOB_API}/book?token_id=${tokenId}`);
  await cache.set(cacheKey, data, 15000); // 15s TTL
  return data;
}

// =========== PRICE HISTORY ===========

export async function fetchPriceHistory(marketId: string, fidelity = 60): Promise<PriceHistoryResponse> {
  const cacheKey = `history:${marketId}:${fidelity}`;
  const cached = await cache.get<PriceHistoryResponse>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry(
      `${CLOB_API}/prices-history?market=${marketId}&interval=max&fidelity=${fidelity}`
    );
    await cache.set(cacheKey, data, 300000); // 5 min TTL
    return data;
  } catch {
    return { history: [] };
  }
}

export async function fetchBatchPriceHistory(marketIds: string[], fidelity = 60): Promise<Record<string, PriceHistoryResponse>> {
  const results: Record<string, PriceHistoryResponse> = {};
  const promises = marketIds.map(async (id) => {
    try {
      const data = await fetchPriceHistory(id, fidelity);
      results[id] = data;
    } catch {
      results[id] = { history: [] };
    }
  });
  await Promise.allSettled(promises);
  return results;
}

// =========== HELPERS ===========

export function extractTokenId(market: GammaMarket): string | null {
  // Markets have clobTokenIds as a JSON string or array
  if (market.clobTokenIds) {
    try {
      const ids = typeof market.clobTokenIds === 'string'
        ? JSON.parse(market.clobTokenIds)
        : market.clobTokenIds;
      return ids[0] || null;
    } catch {
      return null;
    }
  }
  if (market.tokens && market.tokens.length > 0) {
    return market.tokens[0].token_id || null;
  }
  return null;
}

export function extractPrice(market: GammaMarket): number {
  // Try outcomePrices first
  if (market.outcomePrices) {
    try {
      const prices = typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices;
      return parseFloat(prices[0]) || 0.5;
    } catch {
      return 0.5;
    }
  }
  if (market.bestBid != null) return parseFloat(market.bestBid as string);
  if (market.lastTradePrice != null) return parseFloat(market.lastTradePrice as string);
  return 0.5;
}

export function extractVolume(market: GammaMarket): number {
  if (market.volume != null) return parseFloat((market as any).volume as string);
  if ((market as any).volumeNum != null) return parseFloat((market as any).volumeNum as string);
  return 0;
}

export function extractEventSlug(market: GammaMarket): string {
  if (market.events && market.events.length > 0 && market.events[0].slug) {
    return market.events[0].slug;
  }
  if (market.eventSlug) return market.eventSlug;
  if (market.event_slug) return market.event_slug;
  return market.slug || market.market_slug || '';
}
