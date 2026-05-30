/**
 * Sector classification and composite index computation.
 */
import { SECTORS, classifyMarket } from './utils';
import { extractPrice, extractVolume, extractEventSlug } from './polymarket';

/**
 * Classify all markets into sectors.
 */
export function classifyAllMarkets(markets) {
  const sectorized = {};
  for (const key of Object.keys(SECTORS)) {
    sectorized[key] = [];
  }
  sectorized.other = [];

  for (const market of markets) {
    const sector = classifyMarket(market);
    if (!sectorized[sector]) sectorized[sector] = [];
    sectorized[sector].push({
      ...market,
      sector,
      price: extractPrice(market),
      vol: extractVolume(market),
    });
  }

  return sectorized;
}

/**
 * Compute composite index for a sector.
 * Uses volume-weighted average of market probabilities.
 */
export function computeSectorIndex(markets) {
  if (!markets || markets.length === 0) {
    return { index: 0.5, marketCount: 0, totalVolume: 0 };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let totalVolume = 0;

  for (const m of markets) {
    const price = m.price || extractPrice(m) || 0.5;
    const vol = m.vol || extractVolume(m) || 1;

    // Use log volume as weight to prevent one market from dominating
    const weight = Math.log10(vol + 1) + 1;
    weightedSum += price * weight;
    totalWeight += weight;
    totalVolume += vol;
  }

  const index = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

  return {
    index: Math.round(index * 1000) / 1000,
    marketCount: markets.length,
    totalVolume,
  };
}

/**
 * Compute all sector indices.
 */
export function computeAllSectorIndices(markets) {
  const classified = classifyAllMarkets(markets);
  const indices = {};

  for (const [sectorKey, sectorMarkets] of Object.entries(classified)) {
    if (sectorKey === 'other') continue;
    const sectorInfo = SECTORS[sectorKey];
    if (!sectorInfo) continue;

    const indexData = computeSectorIndex(sectorMarkets);

    indices[sectorKey] = {
      ...sectorInfo,
      key: sectorKey,
      ...indexData,
      topMarkets: sectorMarkets
        .sort((a, b) => (b.vol || 0) - (a.vol || 0))
        .slice(0, 10)
        .map(m => ({
          id: m.id || m.condition_id,
          question: m.question || m.title,
          price: m.price,
          volume: m.vol,
          slug: m.slug || m.market_slug,
          eventSlug: extractEventSlug(m),
        })),
    };
  }

  return indices;
}
