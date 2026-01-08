import { logger } from '../../logger.js';
import { wooGet, wooPost } from '../../tools/woo.js';
import { trendAnalysisJob, type TrendData } from './trendAnalysis.js';

export interface RealtimeUpdateConfig {
  productId: number;
  keyword?: string;
  geo?: string;
  includeReddit?: boolean;
  applyPrice?: boolean;
  applyStock?: boolean;
  applyDescription?: boolean;
  dryRun?: boolean;
  maxPriceIncreasePercent?: number;
  maxPriceDecreasePercent?: number;
}

interface WooProduct {
  id?: number;
  name?: string;
  slug?: string;
  regular_price?: string;
  description?: string;
  short_description?: string;
}

interface UpdatePayload extends Record<string, unknown> {
  regular_price?: string;
  stock_status?: 'instock' | 'onbackorder' | 'outofstock';
  description?: string;
  short_description?: string;
}

export async function runWooRealtimeUpdate(config: RealtimeUpdateConfig) {
  const {
    productId,
    keyword,
    geo = 'DE',
    includeReddit = false,
    applyPrice = true,
    applyStock = true,
    applyDescription = true,
    dryRun = false,
    maxPriceIncreasePercent = 20,
    maxPriceDecreasePercent = 15,
  } = config;

  if (!productId || Number.isNaN(Number(productId))) {
    throw new Error('woo_realtime_update: "productId" ist erforderlich.');
  }

  const current = (await wooGet(`/products/${productId}`, {})) as WooProduct;
  const trendKeyword = keyword || current?.name || current?.slug || '';

  logger.info({ productId, trendKeyword, geo, includeReddit }, 'Starte Realtime-Update');

  const trends = await trendAnalysisJob({ keyword: trendKeyword, geo, includeReddit });
  const bestTrend = pickBestTrend(trends.trendingProducts);

  if (!bestTrend) {
    logger.warn({ productId, trendKeyword }, 'Keine Trends gefunden');
    return { updated: false, reason: 'no-trend' };
  }

  const payload: UpdatePayload = {};

  if (applyPrice) {
    const suggested = suggestPrice(bestTrend, current, maxPriceIncreasePercent, maxPriceDecreasePercent);
    if (suggested) payload.regular_price = suggested.toString();
  }

  if (applyStock) {
    payload.stock_status = bestTrend.demandScore >= 60 ? 'instock' : 'onbackorder';
  }

  if (applyDescription) {
    payload.description = buildDescription(bestTrend, current?.description);
    payload.short_description = buildShortDescription(bestTrend);
  }

  if (!Object.keys(payload).length) {
    return { updated: false, reason: 'empty-payload' };
  }

  if (dryRun) {
    logger.info({ productId, payload, trend: bestTrend.niche }, 'Dry-run: kein Woo PUT ausgeführt');
    return {
      updated: false,
      dryRun: true,
      productId,
      trend: bestTrend.niche,
      demandScore: bestTrend.demandScore,
      competition: bestTrend.competition,
      payload,
    };
  }

  await wooPost(`/products/${productId}`, payload, {});

  logger.info({ productId, payload, trend: bestTrend.niche }, 'Realtime-Update abgeschlossen');
  return {
    updated: true,
    productId,
    trend: bestTrend.niche,
    demandScore: bestTrend.demandScore,
    competition: bestTrend.competition,
    payload,
  };
}

function pickBestTrend(trends: TrendData[]) {
  if (!trends || !trends.length) return null;
  return [...trends].sort((a, b) => scoreTrend(b) - scoreTrend(a))[0];
}

function scoreTrend(t: TrendData) {
  const demandWeight = 1.2;
  const competitionPenalty = 0.8;
  return demandWeight * (t.demandScore ?? 0) - competitionPenalty * (t.competition ?? 0);
}

function suggestPrice(
  trend: TrendData,
  current: WooProduct,
  maxIncreasePercent: number,
  maxDecreasePercent: number
) {
  const currentPrice = Number(current?.regular_price) || 0;
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return undefined;

  const base = trend.priceRange
    ? (trend.priceRange.min + trend.priceRange.max) / 2
    : currentPrice;
  if (!Number.isFinite(base) || base <= 0) return undefined;

  let adjusted = Math.max(0, base * demandMultiplier(trend.demandScore));

  // Apply percentage-based limits relative to current price
  const maxPrice = currentPrice * (1 + maxIncreasePercent / 100);
  const minPrice = currentPrice * (1 - maxDecreasePercent / 100);

  if (adjusted > maxPrice) adjusted = maxPrice;
  if (adjusted < minPrice) adjusted = minPrice;

  return Math.round(adjusted / 5) * 5;
}

function demandMultiplier(score: number) {
  if (score >= 90) return 1.25;
  if (score >= 75) return 1.15;
  if (score >= 60) return 1.05;
  if (score >= 45) return 1.0;
  return 0.95;
}

function buildDescription(trend: TrendData, existing?: string) {
  const intro = `<p>Aktualisiert mit Live-Trends (${trend.niche}). Nachfrage: ${trend.demandScore}/100, Wettbewerb: ${trend.competition}/100.</p>`;
  const keywords = trend.keywords?.length ? `<p><strong>Keywords:</strong> ${trend.keywords.join(', ')}</p>` : '';
  const season = trend.seasonality?.length ? `<p><strong>Saison:</strong> ${trend.seasonality.join(', ')}</p>` : '';
  const rest = typeof existing === 'string' ? existing : '';
  return `${intro}${keywords}${season}${rest}`;
}

function buildShortDescription(trend: TrendData) {
  return `Live-optimiert: ${trend.niche} (Demand ${trend.demandScore}/100, Competition ${trend.competition}/100).`;
}

export default runWooRealtimeUpdate;
