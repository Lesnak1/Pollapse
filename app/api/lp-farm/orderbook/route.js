import { NextResponse } from 'next/server';
import { fetchOrderbook } from '@/lib/polymarket';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('token_id');
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Missing token_id parameter' }, { status: 400 });
    }

    const cacheKey = `orderbook-detail:${tokenId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Fetch live orderbook from Polymarket CLOB
    const orderbook = await fetchOrderbook(tokenId);
    
    if (!orderbook || orderbook.error) {
      return NextResponse.json({ 
        error: 'Orderbook not found', 
        message: orderbook?.error || 'No active orderbook exists for this token ID.' 
      }, { status: 404 });
    }

    const result = {
      orderbook,
      timestamp: new Date().toISOString(),
    };

    await cache.set(cacheKey, result, 5000); // 5s short cache for high real-time responsiveness
    return NextResponse.json(result);
  } catch (error) {
    console.error('Orderbook detail proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live orderbook details', message: error.message },
      { status: 500 }
    );
  }
}
