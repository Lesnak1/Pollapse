import { NextResponse } from 'next/server';
import { fetchMarketBySlug, fetchPriceHistory, extractEventSlug } from '@/lib/polymarket';
import { classifyMarket } from '@/lib/utils';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const cacheKey = `market-detail:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Fetch market data from Gamma
    const market = await fetchMarketBySlug(slug);
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Classify sector
    const sector = classifyMarket(market);

    // Extract token ID for price history
    let tokenId = null;
    if (market.clobTokenIds) {
      try {
        const ids = typeof market.clobTokenIds === 'string'
          ? JSON.parse(market.clobTokenIds)
          : market.clobTokenIds;
        tokenId = ids[0];
      } catch { /* fail silent */ }
    } else if (market.tokens && market.tokens.length > 0) {
      tokenId = market.tokens[0].token_id;
    }

    // Fetch price history if token exists
    let history = [];
    if (tokenId) {
      try {
        const histData = await fetchPriceHistory(tokenId, 60);
        history = histData?.history || [];
      } catch (e) {
        console.error('History fetch failed inside route:', e);
      }
    }

    const eventSlug = extractEventSlug(market);

    const result = {
      market: {
        ...market,
        eventSlug,
      },
      sector,
      history,
      tokenId,
      timestamp: new Date().toISOString(),
    };

    await cache.set(cacheKey, result, 60000); // 1 min cache
    return NextResponse.json(result);
  } catch (error) {
    console.error('Market detail proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market details', message: error.message },
      { status: 500 }
    );
  }
}
