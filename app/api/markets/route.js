import { NextResponse } from 'next/server';
import { fetchAllActiveMarkets, extractPrice, extractVolume } from '@/lib/polymarket';
import { classifyMarket } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    let markets = await fetchAllActiveMarkets();

    // Enrich with sector classification and extracted data
    markets = markets.map(m => ({
      id: m.id || m.condition_id,
      conditionId: m.condition_id,
      question: m.question,
      description: m.description,
      slug: m.slug || m.market_slug,
      price: extractPrice(m),
      volume: extractVolume(m),
      sector: classifyMarket(m),
      endDate: m.end_date_iso,
      active: m.active,
      closed: m.closed,
      tokens: m.clobTokenIds,
      outcomePrices: m.outcomePrices,
      outcomes: m.outcomes,
      tags: m.tags,
      image: m.image,
      icon: m.icon,
      liquidity: m.liquidity,
    }));

    // Filter by sector
    if (sector && sector !== 'all') {
      markets = markets.filter(m => m.sector === sector);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      markets = markets.filter(m =>
        (m.question || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      );
    }

    // Sort by volume (highest first)
    markets.sort((a, b) => (b.volume || 0) - (a.volume || 0));

    return NextResponse.json({
      markets: markets.slice(0, limit),
      total: markets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', message: error.message },
      { status: 500 }
    );
  }
}
