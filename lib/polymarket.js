/**
 * Polymarket API Client
 * Handles all communication with Gamma API and CLOB API
 */
import cache from './cache';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

async function fetchWithRetry(url, options = {}, retries = 3) {
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
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

// =========== GAMMA API (Market Discovery) ===========

export async function fetchEvents(params = {}) {
  const cacheKey = `events:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({
    closed: 'false',
    limit: '100',
    active: 'true',
    ...params,
  });

  const data = await fetchWithRetry(`${GAMMA_API}/events?${query}`);
  cache.set(cacheKey, data, 120000); // 2 min TTL
  return data;
}

export async function fetchMarkets(params = {}) {
  const cacheKey = `markets:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({
    closed: 'false',
    limit: '100',
    active: 'true',
    ...params,
  });

  const data = await fetchWithRetry(`${GAMMA_API}/markets?${query}`);
  cache.set(cacheKey, data, 120000);
  return data;
}

export async function fetchAllActiveMarkets() {
  const cacheKey = 'all-active-markets';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let allMarkets = [];
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
    } catch (err) {
      console.error(`Error fetching markets page ${i}:`, err.message);
      break;
    }
  }

  cache.set(cacheKey, allMarkets, 120000);
  return allMarkets;
}

export async function fetchEventBySlug(slug) {
  const cacheKey = `event:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${GAMMA_API}/events/slug/${slug}`);
  cache.set(cacheKey, data, 60000);
  return data;
}

export async function fetchMarketBySlug(slug) {
  const cacheKey = `market-slug:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Try events first (most polymarket URLs use event slugs)
  try {
    const data = await fetchWithRetry(`${GAMMA_API}/events/slug/${slug}`);
    if (data) {
      cache.set(cacheKey, data, 60000);
      return data;
    }
  } catch (e) {
    // fallback to market slug
  }

  const data = await fetchWithRetry(`${GAMMA_API}/markets/slug/${slug}`);
  cache.set(cacheKey, data, 60000);
  return data;
}

export async function searchMarkets(query) {
  const cacheKey = `search:${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(
    `${GAMMA_API}/markets?closed=false&limit=20&${new URLSearchParams({ tag: query })}`
  );
  cache.set(cacheKey, data, 60000);
  return data || [];
}

// =========== CLOB API (Prices & Orderbook) ===========

export async function fetchMidpoint(tokenId) {
  const cacheKey = `midpoint:${tokenId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${CLOB_API}/midpoint?token_id=${tokenId}`);
  cache.set(cacheKey, data, 30000); // 30s TTL
  return data;
}

export async function fetchBatchMidpoints(tokenIds) {
  if (!tokenIds || tokenIds.length === 0) return {};
  const cacheKey = `batch-midpoints:${tokenIds.sort().join(',')}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry(`${CLOB_API}/midpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenIds),
    });
    cache.set(cacheKey, data, 30000);
    return data;
  } catch {
    // Fallback: fetch individually
    const results = {};
    for (const id of tokenIds.slice(0, 20)) {
      try {
        const mid = await fetchMidpoint(id);
        results[id] = mid?.mid || null;
      } catch { /* skip */ }
    }
    return results;
  }
}

export async function fetchOrderbook(tokenId) {
  const cacheKey = `orderbook:${tokenId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(`${CLOB_API}/book?token_id=${tokenId}`);
  cache.set(cacheKey, data, 15000); // 15s TTL
  return data;
}

// =========== PRICE HISTORY ===========

export async function fetchPriceHistory(marketId, fidelity = 60) {
  const cacheKey = `history:${marketId}:${fidelity}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry(
      `${CLOB_API}/prices-history?market=${marketId}&interval=max&fidelity=${fidelity}`
    );
    cache.set(cacheKey, data, 300000); // 5 min TTL
    return data;
  } catch {
    return { history: [] };
  }
}

export async function fetchBatchPriceHistory(marketIds, fidelity = 60) {
  const results = {};
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

export function extractTokenId(market) {
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

export function extractPrice(market) {
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
  if (market.bestBid != null) return parseFloat(market.bestBid);
  if (market.lastTradePrice != null) return parseFloat(market.lastTradePrice);
  return 0.5;
}

export function extractVolume(market) {
  if (market.volume != null) return parseFloat(market.volume);
  if (market.volumeNum != null) return parseFloat(market.volumeNum);
  return 0;
}
