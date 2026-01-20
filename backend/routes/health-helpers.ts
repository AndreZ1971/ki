import tls from 'tls';
import { performance } from 'node:perf_hooks';
import { load as loadHtml } from 'cheerio';
import { getConfig } from '../config';

const DEFAULT_TIMEOUT_MS = 15000;

export interface PerformanceResult {
  success: boolean;
  reportId: string;
  metrics: {
    loadTime: number;
    ttfb: number;
    fcp: number;
    lcp: number;
    bytes: number;
    status: number;
  };
  timestamp: string;
  reportUrl?: string;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface SecurityResult {
  success: boolean;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scannedAt: string;
  details: SecurityIssue[];
  certificate?: {
    valid: boolean;
    daysRemaining?: number;
    validTo?: string;
    issuer?: string;
    subject?: string;
  };
}

export interface SeoIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

export interface SeoResult {
  success: boolean;
  score: number;
  issues: SeoIssue[];
  analyzedAt: string;
}

export interface InventoryResult {
  success: boolean;
  totalProducts?: number;
  lowStock?: number;
  outOfStock?: number;
  score?: number;
  sampleSize?: number;
  message?: string;
}

function normalizeUrl(url: string | undefined): string {
  if (!url) throw new Error('Shop-URL nicht konfiguriert');
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed.startsWith('http')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

async function timedFetch(url: string) {
  const start = performance.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
  const headersReceived = performance.now();
  const text = await res.text();
  const end = performance.now();
  const sizeBytes = Buffer.byteLength(text, 'utf8');
  return {
    res,
    text,
    ttfbMs: headersReceived - start,
    totalMs: end - start,
    sizeBytes,
  };
}

async function checkCertificate(hostname: string, port: number): Promise<{
  valid: boolean;
  daysRemaining?: number;
  validTo?: string;
  issuer?: string;
  subject?: string;
}> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          socket.end();
          return resolve({ valid: false });
        }
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.round(
          (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        resolve({
          valid: daysRemaining > 0,
          daysRemaining,
          validTo: cert.valid_to,
          issuer: cert.issuer?.O || cert.issuer?.CN,
          subject: cert.subject?.CN,
        });
        socket.end();
      }
    );
    socket.on('error', () => resolve({ valid: false }));
    socket.setTimeout(DEFAULT_TIMEOUT_MS, () => {
      socket.destroy();
      resolve({ valid: false });
    });
  });
}

export async function runPerformanceReport(): Promise<PerformanceResult> {
  const config = getConfig();
  const shopUrl = normalizeUrl(config.woocommerce?.url);
  const { res, ttfbMs, totalMs, sizeBytes } = await timedFetch(shopUrl);

  // Ableitungen ohne Zufall: FCP/LCP aus Gesamtzeit geschätzt
  const loadTimeSec = totalMs / 1000;
  const ttfbSec = ttfbMs / 1000;
  const fcpSec = Math.min(loadTimeSec, Math.max(ttfbSec + 0.3, loadTimeSec * 0.35));
  const lcpSec = Math.max(fcpSec + 0.4, loadTimeSec * 0.65);

  return {
    success: true,
    reportId: `perf-${Date.now()}`,
    metrics: {
      loadTime: parseFloat(loadTimeSec.toFixed(3)),
      ttfb: parseFloat(ttfbSec.toFixed(3)),
      fcp: parseFloat(fcpSec.toFixed(3)),
      lcp: parseFloat(lcpSec.toFixed(3)),
      bytes: sizeBytes,
      status: res.status,
    },
    timestamp: new Date().toISOString(),
    reportUrl: undefined,
  };
}

export async function runSecurityScan(): Promise<SecurityResult> {
  const config = getConfig();
  const shopUrl = normalizeUrl(config.woocommerce?.url);
  const { res } = await timedFetch(shopUrl);

  const issues: SecurityIssue[] = [];
  const headers = res.headers;

  const hsts = headers.get('strict-transport-security');
  if (!hsts) {
    issues.push({
      severity: 'high',
      title: 'Fehlender HSTS Header',
      description: 'Strict-Transport-Security fehlt – HTTPS-Erzwingung empfohlen.',
    });
  }

  const csp = headers.get('content-security-policy');
  if (!csp) {
    issues.push({
      severity: 'high',
      title: 'Content-Security-Policy fehlt',
      description: 'CSP schützt vor XSS/Injection – bitte definieren.',
    });
  }

  const xfo = headers.get('x-frame-options');
  if (!xfo) {
    issues.push({
      severity: 'medium',
      title: 'X-Frame-Options fehlt',
      description: 'Clickjacking-Schutz empfehlen (DENY/SAMEORIGIN).',
    });
  }

  const xcto = headers.get('x-content-type-options');
  if (!xcto) {
    issues.push({
      severity: 'medium',
      title: 'X-Content-Type-Options fehlt',
      description: 'nosniff verhindert MIME-Sniffing.',
    });
  }

  const referrer = headers.get('referrer-policy');
  if (!referrer) {
    issues.push({
      severity: 'low',
      title: 'Referrer-Policy fehlt',
      description: 'Empfohlen: no-referrer-when-downgrade oder strict-origin.',
    });
  }

  // TLS-Zertifikat
  const urlObj = new URL(shopUrl);
  const port = urlObj.port ? Number(urlObj.port) : urlObj.protocol === 'https:' ? 443 : 80;
  const certInfo = urlObj.protocol === 'https:' ? await checkCertificate(urlObj.hostname, port) : undefined;
  if (certInfo && (!certInfo.valid || (certInfo.daysRemaining ?? 0) < 15)) {
    issues.push({
      severity: 'critical',
      title: 'Zertifikat abgelaufen/bald ablaufend',
      description: `TLS Zertifikat läuft in ${certInfo.daysRemaining ?? 'unbekannt'} Tagen ab oder ist ungültig.`,
    });
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach((i) => {
    counts[i.severity] += 1;
  });

  return {
    success: true,
    vulnerabilities: counts,
    scannedAt: new Date().toISOString(),
    details: issues,
    certificate: certInfo,
  };
}

export async function runSeoAnalysis(): Promise<SeoResult> {
  const config = getConfig();
  const shopUrl = normalizeUrl(config.woocommerce?.url);
  const { text } = await timedFetch(shopUrl);
  const $ = loadHtml(text);

  const issues: SeoIssue[] = [];
  const title = $('title').first().text().trim();
  if (!title || title.length < 10 || title.length > 65) {
    issues.push({
      severity: 'high',
      message: 'Title Tag fehlt oder ist suboptimal',
      suggestion: 'Zwischen 30-65 Zeichen, klarer Page Purpose.',
    });
  }

  const description = $('meta[name="description"]').attr('content')?.trim();
  if (!description || description.length < 50 || description.length > 170) {
    issues.push({
      severity: 'high',
      message: 'Meta Description fehlt/ungeeignet',
      suggestion: '50-170 Zeichen, Call-to-Action, Keywords.',
    });
  }

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({
      severity: 'medium',
      message: 'Canonical Tag fehlt',
      suggestion: 'Canonical URL setzen, um Duplicate Content zu vermeiden.',
    });
  }

  const h1Count = $('h1').length;
  if (h1Count !== 1) {
    issues.push({
      severity: 'medium',
      message: `Anzahl H1 ist ${h1Count}`,
      suggestion: 'Genau ein H1 pro Seite für klare Struktur.',
    });
  }

  const robots = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  if (robots.includes('noindex')) {
    issues.push({
      severity: 'critical',
      message: 'Seite ist auf noindex gesetzt',
      suggestion: 'noindex entfernen, falls die Seite ranken soll.',
    });
  }

  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (!ogTitle) {
    issues.push({
      severity: 'low',
      message: 'OpenGraph Titel fehlt',
      suggestion: 'OG-Tags für Social Sharing ergänzen.',
    });
  }

  // Bilder Alt-Texte (limitierte Stichprobe)
  const imgs = $('img').toArray().slice(0, 30);
  const missingAlt = imgs.filter((img) => !$(img).attr('alt') || $(img).attr('alt')!.trim() === '').length;
  if (missingAlt > 0) {
    issues.push({
      severity: 'medium',
      message: `${missingAlt} Bilder ohne Alt-Text (Stichprobe)`,
      suggestion: 'Alt-Texte für Barrierefreiheit und SEO ergänzen.',
    });
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25;
    else if (issue.severity === 'high') score -= 12;
    else if (issue.severity === 'medium') score -= 6;
    else score -= 3;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    success: true,
    score,
    issues,
    analyzedAt: new Date().toISOString(),
  };
}

export async function runInventoryMetrics(): Promise<InventoryResult> {
  const config = getConfig();
  const woo = config.woocommerce || {};
  if (!woo.url || !woo.consumerKey || !woo.consumerSecret) {
    return {
      success: false,
      message: 'WooCommerce nicht konfiguriert',
    };
  }

  const baseUrl = normalizeUrl(woo.url);
  const auth = Buffer.from(`${woo.consumerKey}:${woo.consumerSecret}`).toString('base64');
  const perPage = 100;
  let page = 1;
  let totalProducts = 0;
  let lowStock = 0;
  let outOfStock = 0;

  try {
    while (page <= 2) { // limit auf 2 Seiten (max 200 Produkte) für Performance
      const res = await fetch(
        `${baseUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        }
      );
      if (!res.ok) {
        throw new Error(`WooCommerce API Fehler: ${res.status} ${res.statusText}`);
      }
      const products: any[] = await res.json();
      if (!Array.isArray(products) || products.length === 0) break;

      products.forEach((p) => {
        totalProducts += 1;
        const qty = typeof p.stock_quantity === 'number' ? p.stock_quantity : null;
        const stockStatus = p.stock_status;
        if (qty !== null) {
          if (qty <= 0 || stockStatus === 'outofstock') outOfStock += 1;
          else if (qty <= 5) lowStock += 1;
        } else if (stockStatus === 'outofstock') {
          outOfStock += 1;
        }
      });

      if (products.length < perPage) break;
      page += 1;
    }

    const sampleSize = totalProducts;
    const score = sampleSize === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            100 - outOfStock * 3 - lowStock * 1.5
          )
        );

    return {
      success: true,
      totalProducts,
      lowStock,
      outOfStock,
      sampleSize,
      score: Math.round(score),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Fehler bei Inventory-Metriken',
    };
  }
}

export async function runCacheClear(): Promise<{ success: boolean; message: string; clearedItems?: string[]; notConfigured?: boolean; timestamp: string; }> {
  // Kein generischer Cache-Endpoint verfügbar -> ehrliche Antwort
  return {
    success: false,
    notConfigured: true,
    message: 'Cache-Flush ist nicht konfiguriert. Bitte WP/Woo-Cache-Endpoint hinterlegen.',
    timestamp: new Date().toISOString(),
  };
}
