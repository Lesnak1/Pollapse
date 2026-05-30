/**
 * Correlation computation engine for Pollapse.
 * Calculates Pearson correlation between market price series,
 * detects divergences, and clusters related markets.
 */

/**
 * Compute Pearson correlation coefficient between two arrays.
 */
export function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0; // Need at least 5 data points

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return num / denom;
}

/**
 * Align two time series to common timestamps and extract values.
 */
export function alignTimeSeries(seriesA, seriesB) {
  if (!seriesA || !seriesB || !seriesA.length || !seriesB.length) {
    return { x: [], y: [] };
  }

  // Create maps of timestamp -> price
  const mapA = new Map();
  const mapB = new Map();

  for (const point of seriesA) {
    const t = point.t;
    mapA.set(t, parseFloat(point.p));
  }
  for (const point of seriesB) {
    const t = point.t;
    mapB.set(t, parseFloat(point.p));
  }

  // Find common timestamps
  const x = [];
  const y = [];
  for (const [t, priceA] of mapA) {
    if (mapB.has(t)) {
      x.push(priceA);
      y.push(mapB.get(t));
    }
  }

  return { x, y };
}

/**
 * Compute correlation matrix for a set of markets with price histories.
 * Returns an array of { marketA, marketB, correlation }.
 */
export function computeCorrelationPairs(marketsWithHistory) {
  const pairs = [];
  const markets = Object.entries(marketsWithHistory);

  for (let i = 0; i < markets.length; i++) {
    for (let j = i + 1; j < markets.length; j++) {
      const [idA, dataA] = markets[i];
      const [idB, dataB] = markets[j];

      const historyA = dataA.history || [];
      const historyB = dataB.history || [];

      if (historyA.length < 5 || historyB.length < 5) continue;

      const { x, y } = alignTimeSeries(historyA, historyB);
      if (x.length < 5) continue;

      const corr = pearsonCorrelation(x, y);
      if (!isNaN(corr) && isFinite(corr)) {
        pairs.push({
          marketA: idA,
          marketB: idB,
          correlation: Math.round(corr * 1000) / 1000,
        });
      }
    }
  }

  return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Find divergences: market pairs with high historical correlation
 * but current prices that disagree.
 */
export function findDivergences(correlationPairs, marketData, threshold = 0.6) {
  const divergences = [];

  for (const pair of correlationPairs) {
    if (Math.abs(pair.correlation) < threshold) continue;

    const mA = marketData[pair.marketA];
    const mB = marketData[pair.marketB];
    if (!mA || !mB) continue;

    const priceA = mA.price || 0.5;
    const priceB = mB.price || 0.5;

    // For positively correlated markets, they should have similar prices
    // For negatively correlated, they should have inverse prices
    let expectedB;
    if (pair.correlation > 0) {
      expectedB = priceA;
    } else {
      expectedB = 1 - priceA;
    }

    const divergence = Math.abs(priceB - expectedB);

    if (divergence > 0.03) { // At least 3% divergence
      divergences.push({
        ...pair,
        priceA,
        priceB,
        expectedB: Math.round(expectedB * 1000) / 1000,
        divergence: Math.round(divergence * 1000) / 1000,
        marketAData: mA,
        marketBData: mB,
      });
    }
  }

  return divergences.sort((a, b) => b.divergence - a.divergence);
}

/**
 * Build graph data structure for D3.js visualization.
 * Returns { nodes, links } for force-directed graph.
 */
export function buildGraphData(correlationPairs, marketData, minCorrelation = 0.4) {
  const nodeSet = new Set();
  const links = [];

  for (const pair of correlationPairs) {
    if (Math.abs(pair.correlation) < minCorrelation) continue;

    nodeSet.add(pair.marketA);
    nodeSet.add(pair.marketB);

    links.push({
      source: pair.marketA,
      target: pair.marketB,
      value: Math.abs(pair.correlation),
      correlation: pair.correlation,
    });
  }

  const nodes = Array.from(nodeSet).map(id => {
    const m = marketData[id] || {};
    return {
      id,
      label: m.question || m.title || id,
      sector: m.sector || 'other',
      price: m.price || 0.5,
      volume: m.volume || 0,
      slug: m.slug || '',
      eventSlug: m.eventSlug || m.slug || '',
    };
  });

  return { nodes, links };
}
