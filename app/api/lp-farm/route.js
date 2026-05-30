import { NextResponse } from 'next/server';
import { fetchAllActiveMarkets, extractPrice, extractVolume, extractEventSlug } from '@/lib/polymarket';
import { classifyMarket } from '@/lib/utils';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const cacheKey = 'lp-farm-pools';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // 1. Fetch active incentives from Polymarket exchange
    let incentives = [];
    try {
      const incRes = await fetch('https://api.prod.polymarketexchange.com/v1/incentives', {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 }
      });
      if (incRes.ok) {
        const data = await incRes.json();
        incentives = data?.programs || [];
      }
    } catch (e) {
      console.error('Failed to fetch incentives API:', e.message);
    }

    // 2. Fetch all active markets from Gamma API
    const rawMarkets = await fetchAllActiveMarkets();

    // 3. Filter for active rewards-eligible markets
    // Either they have explicit Gamma rewards settings or they are in the active incentives list
    const incSlugs = new Set(incentives.map(p => p.marketSlug.toLowerCase()));

    let rewardMarkets = rawMarkets.filter(m => {
      const hasGammaRewards = (m.rewardsMaxSpread > 0 && m.rewardsMinSize > 0);
      const hasIncRewards = m.slug && incSlugs.has(m.slug.toLowerCase());
      return (hasGammaRewards || hasIncRewards) && m.active && !m.closed;
    });

    // 4. Enrich reward markets
    const enriched = rewardMarkets.map(m => {
      const slugLower = (m.slug || '').toLowerCase();
      const matchedInc = incentives.find(p => p.marketSlug.toLowerCase() === slugLower);
      
      // Determine daily reward pool size
      let dailyPool = 100; // Default $100/day
      if (matchedInc && matchedInc.timePeriods && matchedInc.timePeriods.length > 0) {
        // Find the active or first pending period
        const activePeriod = matchedInc.timePeriods.find(tp => tp.status === 'active') || matchedInc.timePeriods[0];
        if (activePeriod && activePeriod.rewardPool) {
          // If the pool is specified for a period (e.g. 7500 over 3 days), we scale to daily
          const durationDays = Math.max(1, Math.ceil((new Date(activePeriod.end) - new Date(activePeriod.start)) / 86400000));
          dailyPool = Math.round(activePeriod.rewardPool / durationDays);
        }
      } else {
        // Estimate reward pool size for general markets based on volume
        const vol = extractVolume(m);
        if (vol > 1000000) dailyPool = 500;
        else if (vol > 250000) dailyPool = 250;
      }

      // Extract CLOB token IDs
      let tokenIds = [];
      if (m.clobTokenIds) {
        try {
          tokenIds = typeof m.clobTokenIds === 'string'
            ? JSON.parse(m.clobTokenIds)
            : m.clobTokenIds;
        } catch { /* skip */ }
      }

      // Calculate spread and best values if present
      const bestBid = m.bestBid ? parseFloat(m.bestBid) : null;
      const bestAsk = m.bestAsk ? parseFloat(m.bestAsk) : null;
      const currentSpread = (bestBid && bestAsk) ? parseFloat((bestAsk - bestBid).toFixed(4)) : null;

      // Extract 24hr price change for volatility calculations
      const oneDayChange = m.oneDayPriceChange ? Math.abs(parseFloat(m.oneDayPriceChange)) : 0;
      
      return {
        id: m.id || m.condition_id,
        conditionId: m.condition_id,
        question: m.question,
        description: m.description,
        slug: m.slug || m.market_slug,
        eventSlug: extractEventSlug(m),
        price: extractPrice(m),
        volume: extractVolume(m),
        liquidity: m.liquidityClob ? parseFloat(m.liquidityClob) : (m.liquidity ? parseFloat(m.liquidity) : 0),
        sector: classifyMarket(m),
        endDate: m.end_date_iso || m.endDate,
        rewardsMinSize: m.rewardsMinSize ? parseFloat(m.rewardsMinSize) : 100,
        rewardsMaxSpread: m.rewardsMaxSpread ? parseFloat(m.rewardsMaxSpread) : 2.0,
        currentSpread,
        bestBid,
        bestAsk,
        tokenIds,
        dailyPool,
        oneDayChange,
      };
    });

    // Sort by liquidity/volume (highest first)
    enriched.sort((a, b) => (b.liquidity || b.volume || 0) - (a.liquidity || a.volume || 0));

    const result = {
      pools: enriched,
      total: enriched.length,
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 30000); // 30s cache
    return NextResponse.json(result);
  } catch (error) {
    console.error('LP Farm pools API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LP Farm pools', message: error.message },
      { status: 500 }
    );
  }
}
