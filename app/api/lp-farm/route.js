import { NextResponse } from 'next/server';
import { fetchAllActiveMarkets, extractPrice, extractVolume, extractEventSlug } from '@/lib/polymarket';
import { classifyMarket } from '@/lib/utils';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ===========================
// OFFICIAL POLYMARKET APRIL 2026 SPORTS REWARDS (from docs.polymarket.com)
// Per-game total rewards, split Pre/Live. Source: liquidity-rewards.md
// ===========================
const SPORTS_REWARDS = {
  // Soccer (Pre = daily estimate for pre-game, Live = game day pool)
  'English Premier League': { keywords: ['premier league', 'epl'], pre: 2800, live: 7200 },
  'La Liga': { keywords: ['la liga'], pre: 900, live: 2400 },
  'Serie A': { keywords: ['serie a', 'seriea'], pre: 900, live: 2400 },
  'Bundesliga': { keywords: ['bundesliga'], pre: 850, live: 2150 },
  'Ligue 1': { keywords: ['ligue 1', 'ligue1'], pre: 600, live: 1500 },
  'Champions League': { keywords: ['champions league', 'ucl'], pre: 6750, live: 17250 },
  'Europa League': { keywords: ['europa league', 'uel'], pre: 1350, live: 3400 },
  'Conference League': { keywords: ['conference league'], pre: 400, live: 1100 },
  'MLS': { keywords: ['mls', 'major league soccer'], pre: 450, live: 1200 },
  'Liga MX': { keywords: ['liga mx', 'ligamx'], pre: 450, live: 1200 },
  'Copa Libertadores': { keywords: ['copa libertadores', 'libertadores'], pre: 750, live: 1900 },
  'Copa Sudamericana': { keywords: ['copa sudamericana', 'sudamericana'], pre: 225, live: 575 },
  'Argentine Primera': { keywords: ['argentine primera', 'argentina premier division'], pre: 150, live: 400 },
  'Brasileirao': { keywords: ['brasileirao', 'brazilian serie a'], pre: 150, live: 400 },
  'Turkish Super Lig': { keywords: ['turkish super lig', 'super lig', 'süper lig'], pre: 550, live: 1450 },
  'Eredivisie': { keywords: ['eredivisie'], pre: 250, live: 650 },
  'Liga Portugal': { keywords: ['liga portugal', 'portuguese'], pre: 200, live: 550 },
  'Championship EFL': { keywords: ['efl championship', 'championship efl'], pre: 150, live: 350 },
  'Saudi Pro League': { keywords: ['saudi pro league', 'saudi league'], pre: 450, live: 1200 },
  'J1 League': { keywords: ['j1 league', 'j.league'], pre: 300, live: 800 },
  'K League': { keywords: ['k league', 'kleague'], pre: 200, live: 550 },
  'FA Cup': { keywords: ['fa cup'], pre: 850, live: 2000 },

  // Basketball
  'NBA': { keywords: ['nba'], pre: 2150, live: 5550 },
  'EuroLeague': { keywords: ['euroleague', 'euro league'], pre: 150, live: 350 },

  // Baseball
  'MLB': { keywords: ['mlb', 'major league baseball'], pre: 465, live: 1185 },

  // Hockey
  'NHL': { keywords: ['nhl'], pre: 400, live: 1100 },

  // Tennis
  'ATP Tour': { keywords: ['atp', 'atp tour'], pre: 450, live: 1000 },
  'WTA Tour': { keywords: ['wta', 'wta tour'], pre: 300, live: 750 },

  // UFC/MMA
  'UFC Main Card': { keywords: ['ufc main', 'ufc fight night'], pre: 1200, live: 3050 },
  'UFC Prelims': { keywords: ['ufc prelim', 'ufc early prelim'], pre: 250, live: 700 },

  // Cricket
  'IPL': { keywords: ['ipl', 'indian premier league'], pre: 1250, live: 3250 },

  // Esports
  'CS2 Tier A': { keywords: ['cs2 major', 'esl pro league', 'blast premier', 'blast open'], pre: 1550, live: 3950 },
  'CS2 Tier C': { keywords: ['cs2 qualifier', 'cs2 regional'], pre: 150, live: 350 },
  'LoL Tier A': { keywords: ['lck', 'lpl', 'lec playoffs', 'league of legends worlds'], pre: 1550, live: 3950 },
  'LoL Tier C': { keywords: ['league of legends erl', 'lol regional league'], pre: 150, live: 350 },
  'Dota 2 Tier A': { keywords: ['dota 2 dpc', 'dota 2 major', 'the international'], pre: 1000, live: 2500 },
  'Valorant Tier A': { keywords: ['vct', 'valorant champions', 'valorant masters'], pre: 1000, live: 2500 },

  // Generic soccer fallbacks
  'Soccer Major League': { keywords: ['soccer', 'football', 'fifa world cup', 'world cup', 'fifa', 'uefa'], pre: 450, live: 1200 },

  // Generic sports fallbacks
  'Generic Sports': { keywords: ['nfl', 'ncaa', 'rugby', 'chess', 'cricket', 'lacrosse', 'table tennis', 'snooker', 'darts', 'cycling', 'swimming', 'boxing', 'golf', 'pga', 'formula 1', 'f1', 'indycar', 'nascar'], pre: 200, live: 500 },
};

// ===========================
// SPORTS LEAGUE CLASSIFIER
// Matches market question/event slug against known league keywords
// ===========================
function classifySportsLeague(question, eventSlug) {
  const text = `${question || ''} ${eventSlug || ''}`.toLowerCase();
  for (const [league, data] of Object.entries(SPORTS_REWARDS)) {
    for (const kw of data.keywords) {
      if (text.includes(kw)) return league;
    }
  }
  return null;
}

// ===========================
// SPORTS DAILY POOL CALCULATOR
// Uses official reward table. Pre-game amount is the baseline daily estimate.
// On game day (daysLeft <= 1), uses the live reward.
// ===========================
function getSportsDailyPool(question, eventSlug, endDate) {
  const league = classifySportsLeague(question, eventSlug);
  if (!league) return null;
  const rewards = SPORTS_REWARDS[league];
  if (!rewards) return null;

  // If market resolves within 1 day, it's game day → use live reward
  const now = new Date();
  const end = new Date(endDate);
  const daysLeft = endDate ? Math.max(0, Math.ceil((end - now) / 86400000)) : 999;

  if (daysLeft <= 1) return rewards.live;
  return rewards.pre;
}

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
    const incSlugs = new Set(incentives.map(p => p.marketSlug.toLowerCase()));

    let rewardMarkets = rawMarkets.filter(m => {
      const hasGammaSettings = (m.rewardsMaxSpread > 0 && m.rewardsMinSize > 0);
      const hasActiveRewards = m.holdingRewardsEnabled === true;
      const hasIncRewards = m.slug && incSlugs.has(m.slug.toLowerCase());
      return (hasIncRewards || (hasGammaSettings && hasActiveRewards)) && m.active && !m.closed;
    });

    // 4. Enrich reward markets
    const enriched = rewardMarkets.map(m => {
      const slugLower = (m.slug || '').toLowerCase();
      const matchedInc = incentives.find(p => p.marketSlug.toLowerCase() === slugLower);

      // Determine daily reward pool size
      let dailyPool = 100;
      let rewardSource = 'estimated';

      if (matchedInc && matchedInc.timePeriods && matchedInc.timePeriods.length > 0) {
        // CONFIRMED: Incentives API has exact reward data
        const activePeriod = matchedInc.timePeriods.find(tp => tp.status === 'active') || matchedInc.timePeriods[0];
        if (activePeriod && activePeriod.rewardPool) {
          const durationDays = Math.max(1, Math.ceil((new Date(activePeriod.end) - new Date(activePeriod.start)) / 86400000));
          dailyPool = Math.round(activePeriod.rewardPool / durationDays);
          rewardSource = 'incentives';
        }
      } else {
        const endDate = m.end_date_iso || m.endDate;
        const eventSlug = extractEventSlug(m);

        // OFFICIAL: Check sports reward table first (independent of sector classification)
        const sportsPool = getSportsDailyPool(m.question, eventSlug, endDate);
        if (sportsPool) {
          dailyPool = sportsPool;
          rewardSource = 'official';
        } else {
          // Volume-based estimation for non-sports markets
          const vol = extractVolume(m);
          if (vol > 1000000) dailyPool = 500;
          else if (vol > 250000) dailyPool = 250;
        }
      }

      // NaN safety check
      if (!dailyPool || isNaN(dailyPool)) dailyPool = 100;

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
        rewardSource,
        holdingRewardsEnabled: m.holdingRewardsEnabled === true,
        feesEnabled: m.feesEnabled === true,
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

    cache.set(cacheKey, result, 30000);
    return NextResponse.json(result);
  } catch (error) {
    console.error('LP Farm pools API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LP Farm pools', message: error.message },
      { status: 500 }
    );
  }
}
