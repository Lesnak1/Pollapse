import { NextResponse } from 'next/server';
import { getMarketInfo } from '@/lib/trading/clobClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenID = searchParams.get('tokenID');

    if (!tokenID) {
      return NextResponse.json(
        { error: 'Missing tokenID parameter' },
        { status: 400 }
      );
    }

    const marketInfo = await getMarketInfo(tokenID);
    return NextResponse.json({
      success: true,
      marketInfo,
    });
  } catch (error: any) {
    console.error('Error fetching market info from CLOB:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve market info', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method Not Allowed', message: 'Order creation is executed completely client-side in Task 4.' },
    { status: 405 }
  );
}
