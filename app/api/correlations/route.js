import { NextResponse } from 'next/server';
import { fetchAllActiveMarkets, fetchPriceHistory, extractPrice, extractVolume, extractEventSlug } from '@/lib/polymarket';
import { classifyMarket } from '@/lib/utils';
import { computeCorrelationPairs, findDivergences, buildGraphData } from '@/lib/correlations';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const minCorrelation = parseFloat(searchParams.get('min') || '0.3');
    const maxMarkets = parseInt(searchParams.get('limit') || '40');

    // Check cache first (this is expensive computation)
    const cacheKey = `correlations:${minCorrelation}:${maxMarkets}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // 1. Fetch top markets by volume
    let markets = await fetchAllActiveMarkets();
    markets = markets
      .map(m => ({
        id: m.condition_id || m.id,
        question: m.question,
        slug: m.slug || m.market_slug,
        eventSlug: extractEventSlug(m),
        price: extractPrice(m),
        volume: extractVolume(m),
        sector: classifyMarket(m),
        tokens: m.clobTokenIds,
      }))
      .filter(m => m.volume > 1000 && m.id) // Only markets with meaningful volume
      .sort((a, b) => b.volume - a.volume)
      .slice(0, maxMarkets);

    // 2. Fetch price histories for top markets
    const histories = {};
    const historyPromises = markets.map(async (m) => {
      try {
        const tokenIds = typeof m.tokens === 'string' ? JSON.parse(m.tokens) : m.tokens;
        const tokenId = tokenIds?.[0];
        if (!tokenId) return;

        const data = await fetchPriceHistory(tokenId, 60);
        if (data?.history?.length > 5) {
          histories[m.id] = data;
        }
      } catch { /* skip markets without history */ }
    });
    await Promise.allSettled(historyPromises);

    // 3. Compute correlations
    const pairs = computeCorrelationPairs(histories);

    // 4. Build market lookup
    const marketData = {};
    for (const m of markets) {
      marketData[m.id] = m;
    }

    // 5. Find divergences
    const divergences = findDivergences(pairs, marketData, 0.5);

    // 6. Build graph data
    const graph = buildGraphData(pairs, marketData, minCorrelation);

    // 7. Get top correlated pairs with market info
    const topPairs = pairs
      .filter(p => Math.abs(p.correlation) >= minCorrelation)
      .slice(0, 20)
      .map(p => ({
        ...p,
        marketATitle: marketData[p.marketA]?.question || p.marketA,
        marketBTitle: marketData[p.marketB]?.question || p.marketB,
        marketASector: marketData[p.marketA]?.sector || 'other',
        marketBSector: marketData[p.marketB]?.sector || 'other',
        marketAPrice: marketData[p.marketA]?.price,
        marketBPrice: marketData[p.marketB]?.price,
      }));

    const result = {
      pairs: topPairs,
      divergences: divergences.slice(0, 10),
      graph,
      stats: {
        marketsAnalyzed: Object.keys(histories).length,
        totalPairs: pairs.length,
        strongCorrelations: pairs.filter(p => Math.abs(p.correlation) > 0.7).length,
        divergenceCount: divergences.length,
      },
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 300000); // 5 min cache
    return NextResponse.json(result);
  } catch (error) {
    console.error('Correlations API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute correlations', message: error.message },
      { status: 500 }
    );
  }
}
