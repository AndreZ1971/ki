// src/agent/tools.ts

// =======================
// external (values)
// =======================
import axios, { isAxiosError } from 'axios';

// =======================
// internal (values)
// =======================
// WooCommerce-Wrapper exakt zu den Planner-Toolnamen passend.
import { wooGet, wooPost } from '../tools/woo.js';
import { wpTools } from '../tools/wp.js';
// =======================
// internal (types)
// =======================
import { createBundlesSeed } from './jobs/bundles.js';
import { createKitsSeed } from './jobs/kitsTemplates.js';
import { createMiniAudit } from './jobs/miniAudit.js';
import { createPremiumAudit } from './jobs/premiumAudit.js';
import { createStandardAudit } from './jobs/standardAudit.js';
import { runWooRealtimeUpdate } from './jobs/wooRealtimeUpdate.js';

import type { Tool } from '../types.js';

// --------------------------------------------------------------
// Utilities
// --------------------------------------------------------------
export const timeTool: Tool = {
  name: 'time_now',
  description: 'Gibt die aktuelle ISO-Zeit zurück.',
  async run() {
    return { now: new Date().toISOString() };
  },
};

type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JSONValue }
  | JSONValue[];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function extractHttpStatus(e: unknown): number | undefined {
  if (isAxiosError(e)) return e.response?.status;
  return undefined;
}

function extractHttpMessage(e: unknown): string {
  if (isAxiosError(e)) {
    const d = e.response?.data as unknown;
    const msgFromData =
      isRecord(d) && typeof (d as Record<string, unknown>).message === 'string'
        ? ((d as Record<string, unknown>).message as string)
        : undefined;
    return msgFromData ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

function wpRestFallback(url: string): string | null {
  // /wp-json -> /index.php?rest_route=/
  const m = url.match(/\/wp-json\/?$/i);
  if (!m) return null;
  return url.replace(/\/wp-json\/?$/i, '/index.php?rest_route=/');
}

// --------------------------------------------------------------
// HTTP GET (JSON) — für Diagnosen
// --------------------------------------------------------------
export const httpGetTool: Tool = {
  name: 'http_get',
  description:
    'HTTP GET (JSON erwartet). Input: { url: string, headers?: Record<string,string>, timeout_ms?: number }',
  async run(input) {
    const { url, headers, timeout_ms } = input as {
      url: string;
      headers?: Record<string, string>;
      timeout_ms?: number;
    };

    const isGh = /(^|\/\/)api\.github\.com/i.test(url);
    const token = process.env.GITHUB_TOKEN?.trim();
    const looksLikeGhToken =
      !!token &&
      (token.startsWith('ghp_') ||
        token.startsWith('github_pat_') ||
        token.startsWith('gho_') ||
        token.startsWith('ghu_') ||
        token.startsWith('ghs_'));

    const baseHeaders: Record<string, string> = {
      'user-agent': 'ki-agent',
      ...(isGh
        ? {
            accept: 'application/vnd.github+json',
            'x-github-api-version': '2022-11-28',
          }
        : {
            accept: 'application/json, text/plain, */*',
          }),
      ...(headers ?? {}),
    };

    const defaultTimeout = timeout_ms ?? (isGh ? 10000 : 30000);

    const fetchOnce = async (
      useAuth: boolean,
      tmo: number,
      targetUrl: string
    ) =>
      axios.get(targetUrl, {
        timeout: tmo,
        headers: {
          ...baseHeaders,
          ...(useAuth && isGh && looksLikeGhToken
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
      });

    try {
      try {
        const res = await fetchOnce(true, defaultTimeout, url);
        return {
          status: res.status,
          data: res.data as unknown as JSONValue,
          authed: isGh && looksLikeGhToken ? true : false,
        };
      } catch (err: unknown) {
        const status = extractHttpStatus(err);
        const code = isAxiosError(err) ? err.code : undefined;

        const isTimeout = code === 'ECONNABORTED' || status === undefined;
        const isGhAuthIssue = isGh && (status === 401 || status === 403);

        if (isGhAuthIssue) {
          const res = await fetchOnce(false, defaultTimeout, url);
          return {
            status: res.status,
            data: res.data as unknown as JSONValue,
            authed: false as const,
            fallback: true as const,
          };
        }

        if (isTimeout) {
          const alt = wpRestFallback(url);
          if (alt) {
            const res = await fetchOnce(false, defaultTimeout, alt);
            return {
              status: res.status,
              data: res.data as unknown as JSONValue,
              fallback: 'wp_rest_route' as const,
            };
          }
        }

        throw err;
      }
    } catch (err: unknown) {
      const status = extractHttpStatus(err);
      const msg = extractHttpMessage(err);
      throw new Error(`HTTP GET failed (${status ?? 'no-status'}): ${msg}`);
    }
  },
};

// --------------------------------------------------------------
// JSON pick (Dot-Path)
// --------------------------------------------------------------
function getByPath(obj: unknown, path: string): JSONValue | undefined {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const key of parts) {
    if (!isRecord(cur) || !(key in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur as JSONValue | undefined;
}

export const jsonPickTool: Tool = {
  name: 'json_pick',
  description:
    'Extrahiert einen Wert aus JSON per einfacher Dot-Path-Notation. Input: { json: unknown, path: string }',
  async run(input) {
    const { json, path } = input as { json: unknown; path: string };
    const value = getByPath(json, path);
    return value === undefined
      ? { ok: false, reason: 'path not found', value: null as JSONValue | null }
      : { ok: true, value: value as JSONValue };
  },
};

// --------------------------------------------------------------
// Deterministische WooCommerce-Tools (Planner-kompatible Namen)
// --------------------------------------------------------------
export const wooGetTool: Tool = {
  name: 'woo_get',
  description:
    'WooCommerce GET. Input: { path: string, params?: Record<string,unknown> } → gibt Woo-API Antwort zurück.',
  async run(input) {
    const { path, params } = input as {
      method?: string; // wird ignoriert
      path: string;
      params?: Record<string, unknown>;
    };
    if (!path || typeof path !== 'string') {
      throw new Error('woo_get: "path" (string) ist erforderlich.');
    }
    return await wooGet(path, params ?? {});
  },
};

export const wooPostTool: Tool = {
  name: 'woo_post',
  description:
    'WooCommerce POST/PUT. Input: { path: string, data?: Record<string,unknown>, params?: Record<string,unknown> } → gibt Woo-API Antwort zurück.',
  async run(input) {
    const { path, data, params } = input as {
      method?: string; // wird ignoriert
      path: string;
      data?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };
    if (!path || typeof path !== 'string') {
      throw new Error('woo_post: "path" (string) ist erforderlich.');
    }
    return await wooPost(path, data ?? {}, params ?? {});
  },
};

// --------------------------------------------------------------
// Job-Tools (für Seeds & Produkt-Anlage)
// --------------------------------------------------------------
export const wooCreateMiniAuditTool: Tool = {
  name: 'woo_create_mini_audit',
  description: 'Legt das Mini-Audit (50 €) an und setzt die Beschreibung.',
  async run() {
    return await createMiniAudit();
  },
};

export const wooCreateStandardAuditTool: Tool = {
  name: 'woo_create_standard_audit',
  description: 'Legt das Standard-Audit (150 €) an und setzt die Beschreibung.',
  async run() {
    return await createStandardAudit();
  },
};

export const wooCreatePremiumAuditTool: Tool = {
  name: 'woo_create_premium_audit',
  description: 'Legt das Premium-Audit (250 €) an und setzt die Beschreibung.',
  async run() {
    return await createPremiumAudit();
  },
};

export const wooCreateKitsSeedTool: Tool = {
  name: 'woo_create_kits_seed',
  description: 'Legt DevStarter-Kits in Kategorie 53 an.',
  async run() {
    return await createKitsSeed();
  },
};

export const wooCreateBundlesSeedTool: Tool = {
  name: 'woo_create_bundles_seed',
  description: 'Legt ein Kern-Bundle in Kategorie 52 an.',
  async run() {
    return await createBundlesSeed();
  },
};

export const wooRealtimeUpdateTool: Tool = {
  name: 'woo_realtime_update',
  description:
    'Live-Trend-Update für bestehende Produkte (Preis/Lager/Text). Input: { productId: number, keyword?: string, geo?: string, includeReddit?: boolean, applyPrice?: boolean, applyStock?: boolean, applyDescription?: boolean, dryRun?: boolean }',
  async run(input) {
    const {
      productId,
      keyword,
      geo,
      includeReddit,
      applyPrice,
      applyStock,
      applyDescription,
      dryRun,
    } = input as {
      productId: number;
      keyword?: string;
      geo?: string;
      includeReddit?: boolean;
      applyPrice?: boolean;
      applyStock?: boolean;
      applyDescription?: boolean;
      dryRun?: boolean;
    };

    return await runWooRealtimeUpdate({
      productId,
      keyword,
      geo,
      includeReddit,
      applyPrice,
      applyStock,
      applyDescription,
      dryRun,
    });
  },
};

// --------------------------------------------------------------
// Tool-Registry & Katalog
// --------------------------------------------------------------
export const tools: Tool[] = [
  // Utils
  timeTool,
  httpGetTool,
  jsonPickTool,

  // Woo: EXPLIZIT, damit die Toolnamen sicher vorhanden sind:
  wooGetTool,
  wooPostTool,

  // Jobs / Seeds
  wooCreateMiniAuditTool,
  wooCreateStandardAuditTool,
  wooCreatePremiumAuditTool,
  wooCreateKitsSeedTool,
  wooCreateBundlesSeedTool,
  wooRealtimeUpdateTool,

  // WP: Upload / weitere Helfer
  ...wpTools,
];

export function toolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function toolCatalogForSystem(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
}

export default tools;
