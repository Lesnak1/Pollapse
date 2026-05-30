import { NextResponse } from 'next/server';
import { fetchAllActiveMarkets } from '@/lib/polymarket';
import { computeAllSectorIndices } from '@/lib/sectors';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cacheKey = 'sector-indices';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const markets = await fetchAllActiveMarkets();
    const indices = computeAllSectorIndices(markets);

    const result = {
      sectors: indices,
      totalMarkets: markets.length,
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 120000); // 2 min cache
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sectors API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute sector indices', message: error.message },
      { status: 500 }
    );
  }
}
