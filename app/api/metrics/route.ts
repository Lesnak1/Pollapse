import { NextResponse } from 'next/server';
import { getBuilderClobClient } from '@/lib/trading/clobClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const builderCode = process.env.POLY_BUILDER_CODE;
    if (!builderCode) {
      return NextResponse.json({
        success: false,
        error: 'Builder code not configured in environment variables'
      }, { status: 500 });
    }

    const client = getBuilderClobClient();
    
    let tradesList: any[] = [];
    try {
      const response = await client.getBuilderTrades({
        builder_code: builderCode
      });
      tradesList = response?.trades || [];
    } catch (e: any) {
      console.warn('Could not retrieve active trades from CLOB:', e.message);
      // Fail silently and return zero metrics rather than crashing
    }

    // Compute active metrics
    const totalTrades = tradesList.length;
    let totalVolumeUsdc = 0;
    let totalFeesGenerated = 0;

    for (const trade of tradesList) {
      const vol = parseFloat(trade.sizeUsdc || '0');
      const fee = parseFloat(trade.builderFee || '0');
      totalVolumeUsdc += vol;
      totalFeesGenerated += fee;
    }

    return NextResponse.json({
      success: true,
      metrics: {
        volume: Number(totalVolumeUsdc.toFixed(2)),
        trades: totalTrades,
        fees: Number(totalFeesGenerated.toFixed(4)),
        builderCode
      }
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error.message
    }, { status: 500 });
  }
}
