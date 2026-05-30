import { NextResponse } from 'next/server';
import { getActiveUsers } from '@/lib/bot-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ==========================================
// CORE SAFE FARM STRATEGY MATH FOR BOT
// ==========================================

const getDaysUntilEnd = (endDate) => {
  if (!endDate) return 999;
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end - now) / 86400000));
};

const checkEligibility = (pool, userBudget, side) => {
  const price = side === 'YES' ? (pool.price || 0.5) : (1 - (pool.price || 0.5));
  const minShares = pool.rewardsMinSize || 100;
  const requiredCapital = minShares * price;
  const eligible = userBudget >= requiredCapital;
  const estimatedShares = userBudget / price;
  return { eligible, requiredCapital, minShares, estimatedShares, price };
};

const getFillRisk = (pool, userBudget, side = 'YES') => {
  const totalDepth = pool.liquidity || 0;
  const bidDepthUSD = totalDepth / 2;
  const askDepthUSD = totalDepth / 2;

  const relevantDepth = side === 'YES' ? bidDepthUSD : askDepthUSD;
  const cushionRatio = relevantDepth > 0 ? relevantDepth / userBudget : 0;
  
  let sectorPenalty = 0;
  if (pool.sector === 'sports') sectorPenalty = 40;
  else if (pool.sector === 'geopolitics') sectorPenalty = 25;
  else if (pool.sector === 'crypto') sectorPenalty = 15;

  const daysLeft = getDaysUntilEnd(pool.endDate);
  let timePenalty = 0;
  if (daysLeft < 3) timePenalty = 35;
  else if (daysLeft < 14) timePenalty = 15;
  else if (daysLeft < 30) timePenalty = 5;

  const changePenalty = Math.min(30, (pool.oneDayChange || 0) * 300);
  let baseSafety = Math.min(50, cushionRatio * 5);

  const fillRisk = Math.min(100, Math.max(0, Math.round(
    100 - baseSafety + sectorPenalty + timePenalty + changePenalty
  )));

  let label, color, emoji;
  if (fillRisk <= 30) { label = 'Low Risk'; color = '#10b981'; emoji = '🟢'; }
  else if (fillRisk <= 60) { label = 'Medium Risk'; color = '#f59e0b'; emoji = '🟡'; }
  else { label = 'High Risk'; color = '#ef4444'; emoji = '🔴'; }

  return { 
    score: fillRisk, 
    label, 
    color, 
    emoji, 
    relevantDepth: Math.round(relevantDepth)
  };
};

const getRewardShare = (pool, userBudget) => {
  const totalLiq = pool.liquidity || 50000;
  const sharePercent = (userBudget / (totalLiq + userBudget)) * 100;
  const dailyReward = (sharePercent / 100) * (pool.dailyPool || 100);
  const dailyROI = userBudget > 0 ? (dailyReward / userBudget) * 100 : 0;
  
  return { sharePercent, dailyReward, dailyROI };
};

const getLPScore = (pool, userBudget, side = 'YES') => {
  const eligibility = checkEligibility(pool, userBudget, side);
  
  if (!eligibility.eligible) {
    return { score: 10, verdict: 'Ineligible', color: '#6b7280', badge: '❌ INELIGIBLE' };
  }

  const fillRisk = getFillRisk(pool, userBudget, side);
  const reward = getRewardShare(pool, userBudget);
  const daysLeft = getDaysUntilEnd(pool.endDate);
  
  const safetyScore = 100 - fillRisk.score;
  const yieldScore = Math.min(100, reward.dailyROI * 500);
  const competitionRatio = pool.liquidity > 0 ? userBudget / pool.liquidity : 1;
  const compScore = Math.min(100, competitionRatio * 1000);
  const durationScore = Math.min(100, daysLeft * 1.5);

  const finalScore = Math.round(
    safetyScore * 0.40 +
    yieldScore * 0.25 +
    compScore * 0.20 +
    durationScore * 0.15
  );
  
  const clamped = Math.min(100, Math.max(0, finalScore));
  
  let verdict, color, badge;
  if (clamped >= 70) { verdict = 'Recommended'; color = '#10b981'; badge = '✅ RECOMMENDED'; }
  else if (clamped >= 45) { verdict = 'Moderate'; color = '#f59e0b'; badge = '⚠️ CAUTION'; }
  else { verdict = 'Risky'; color = '#ef4444'; badge = '🚫 HIGH RISK'; }

  return { score: clamped, verdict, color, badge };
};

// ==========================================
// CRON ROUTE HANDLER
// ==========================================

export async function GET(request) {
  try {
    const origin = request.nextUrl.origin || 'http://localhost:3000';
    
    // 1. Fetch live pools from internal API
    const poolsRes = await fetch(`${origin}/api/lp-farm`, { cache: 'no-store' });
    if (!poolsRes.ok) {
      throw new Error(`Failed to fetch LP pools from proxy: ${poolsRes.statusText}`);
    }
    const data = await poolsRes.json();
    const pools = data?.pools || [];

    const defaultBudget = 1500;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const publicChannelId = process.env.TELEGRAM_CHAT_ID;

    // Load registered personalized users from JSON DB
    const activeUsers = getActiveUsers();
    const dispatchLog = [];

    // Helper to post Telegram messages
    const sendTelegramMessage = async (chatId, text) => {
      if (!botToken) return false;
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: String(chatId),
            text: text,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
          })
        });
        return res.ok;
      } catch {
        return false;
      }
    };

    // 2. DISPATCH PERSONALIZED USER ALERTS
    for (const user of activeUsers) {
      const userAlerts = [];

      pools.forEach(pool => {
        // Sector Filter Ingestion
        const matchesSector = user.sectors.includes('all') || user.sectors.includes(pool.sector);
        if (!matchesSector) return;

        ['YES', 'NO'].forEach(side => {
          const eligibility = checkEligibility(pool, user.budget, side);
          if (!eligibility.eligible) return; // budget doesn't meet minimum contracs

          const fillRisk = getFillRisk(pool, user.budget, side);
          
          // Risk Profile Ingestion
          // - 'low': score <= 30 only
          // - 'medium': score <= 60 only
          // - 'high': any risk score allowed
          if (user.risk === 'low' && fillRisk.score > 30) return;
          if (user.risk === 'medium' && fillRisk.score > 60) return;

          const reward = getRewardShare(pool, user.budget);
          const lpScore = getLPScore(pool, user.budget, side);

          // We only alert high quality Recommended opportunities for custom users too
          if (lpScore.score >= 70 && reward.dailyROI >= 0.04) {
            const daysLeft = getDaysUntilEnd(pool.endDate);
            const appLink = `${origin}/lp-farm?selected=${pool.id}`;
            const polyLink = `https://polymarket.com/event/${pool.eventSlug || pool.slug}`;

            const message = `🔔 *PERSONALIZED SafeFarm Alert* 🚨\n\n*Safe LP Opportunity matching your exact filters!*\n\n📌 *Market:* ${pool.question}\n🗂️ *Sector:* ${pool.sector.toUpperCase()} (${side} side)\n💰 *Daily Reward Pool:* $${pool.dailyPool}/day\n\n📊 *Farming Metrics ($${user.budget.toLocaleString()} Budget):*\n• *Farming Verdict:* ${lpScore.badge}\n• *LP Suitability Score:* ${lpScore.score}/100\n• *Fill Risk:* ${fillRisk.emoji} ${fillRisk.score}% (${fillRisk.label})\n• *Cushion Wall:* $${fillRisk.relevantDepth.toLocaleString()} (Your Shield)\n• *Est. Daily Yield:* $${reward.dailyReward.toFixed(2)}/day\n• *Daily ROI:* ${reward.dailyROI.toFixed(3)}% (${(reward.dailyROI * 30).toFixed(2)}% Est. Monthly)\n• *Farming Horizon:* ${daysLeft} days remaining\n\n⚠️ *Min qualification:* min ${pool.rewardsMinSize} shares | max ${pool.rewardsMaxSpread}% spread limit.\n\n🔗 *Action:* [Open Pollapse Terminal](${appLink}) | [Trade on Polymarket](${polyLink})`;

            userAlerts.push(message);
          }
        });
      });

      if (userAlerts.length > 0 && botToken) {
        // Send top 2 alerts to the user
        const mergedText = userAlerts.slice(0, 2).join('\n\n---\n\n');
        const success = await sendTelegramMessage(user.chatId, mergedText);
        dispatchLog.push({
          chatId: user.chatId,
          username: user.username,
          alertsCount: userAlerts.length,
          delivered: success
        });
      }
    }

    // 3. BROADCAST GENERAL CHANNEL ALERTS (Fallback/Public Channel)
    const publicAlerts = [];
    pools.forEach(pool => {
      ['YES', 'NO'].forEach(side => {
        const eligibility = checkEligibility(pool, defaultBudget, side);
        if (!eligibility.eligible) return;

        const fillRisk = getFillRisk(pool, defaultBudget, side);
        const reward = getRewardShare(pool, defaultBudget);
        const lpScore = getLPScore(pool, defaultBudget, side);

        if (lpScore.score >= 70 && fillRisk.score <= 40 && reward.dailyROI >= 0.04) {
          const daysLeft = getDaysUntilEnd(pool.endDate);
          const appLink = `${origin}/lp-farm?selected=${pool.id}`;
          const polyLink = `https://polymarket.com/event/${pool.eventSlug || pool.slug}`;

          const message = `🔔 *POLLAPSE SafeFarm Alpha Alert* 🚨\n\n*Highly Profitable & Safe LP Opportunity Detected!*\n\n📌 *Market:* ${pool.question}\n🗂️ *Sector:* ${pool.sector.toUpperCase()} (${side} side)\n💰 *Daily Reward Pool:* $${pool.dailyPool}/day\n\n📊 *Farming Metrics ($${defaultBudget} Budget):*\n• *Farming Verdict:* ${lpScore.badge}\n• *LP Suitability Score:* ${lpScore.score}/100\n• *Fill Risk:* ${fillRisk.emoji} ${fillRisk.score}% (${fillRisk.label})\n• *Cushion Wall:* $${fillRisk.relevantDepth.toLocaleString()} (Strong Shield)\n• *Est. Daily Yield:* $${reward.dailyReward.toFixed(2)}/day\n• *Daily ROI:* ${reward.dailyROI.toFixed(3)}% (${(reward.dailyROI * 30).toFixed(2)}% Est. Monthly)\n• *Farming Horizon:* ${daysLeft} days remaining\n\n⚠️ *Min qualification:* min ${pool.rewardsMinSize} shares | max ${pool.rewardsMaxSpread}% spread limit.\n\n🔗 *Action:* [Farm Safely on Pollapse](${appLink}) | [Open Polymarket](${polyLink})`;

          publicAlerts.push(message);
        }
      });
    });

    let postedToPublic = false;
    if (botToken && publicChannelId && publicAlerts.length > 0) {
      const text = publicAlerts.slice(0, 2).join('\n\n---\n\n');
      postedToPublic = await sendTelegramMessage(publicChannelId, text);
    }

    return NextResponse.json({
      success: true,
      scanCount: pools.length,
      publicAlertsFound: publicAlerts.length,
      publicBroadcastSent: postedToPublic,
      telegramConfigured: !!botToken,
      activeUserCount: activeUsers.length,
      dispatchLog,
      rawSample: publicAlerts[0] || 'No general alerts triggered at this time.'
    });
  } catch (error) {
    console.error('SafeFarm alert bot cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run alert scan', message: error.message },
      { status: 500 }
    );
  }
}
