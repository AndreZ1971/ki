// src/agent/tools.ts

// external (values)
import axios, { isAxiosError } from 'axios';

// internal (values)
import { wooTools } from '../tools/woo.js';
import { wpTools } from '../tools/wp.js';

// internal (types)
import type { Tool } from '../types.js';

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
      isRecord(d) && typeof d.message === 'string' ? d.message : undefined;
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

    const fetchOnce = async (useAuth: boolean, tmo: number, targetUrl: string) =>
      axios.get(targetUrl, {
        timeout: tmo,
        headers: {
          ...baseHeaders,
          ...(useAuth && isGh && looksLikeGhToken ? { Authorization: `Bearer ${token}` } : {}),
        },
        // axios folgt Redirects standardmäßig; nichts weiter nötig
      });

    try {
      // 1) Primärversuch
      try {
        const res = await fetchOnce(true, defaultTimeout, url);
        return { status: res.status, data: res.data as unknown as JSONValue, authed: isGh && looksLikeGhToken ? true : false };
      } catch (err: unknown) {
        // GitHub: bei 401/403 ohne Auth fallbacken
        const status = extractHttpStatus(err);
        const code = isAxiosError(err) ? err.code : undefined;

        const isTimeout = code === 'ECONNABORTED' || status === undefined; // Timeout oder kein Status
        const isGhAuthIssue = isGh && (status === 401 || status === 403);

        // 2) Bei GH-Auth-Issue: ohne Auth erneut probieren
        if (isGhAuthIssue) {
          const res = await fetchOnce(false, defaultTimeout, url);
          return { status: res.status, data: res.data as unknown as JSONValue, authed: false as const, fallback: true as const };
        }

        // 3) Bei Timeout + WP: auf /index.php?rest_route=/ ausweichen
        if (isTimeout) {
          const alt = wpRestFallback(url);
          if (alt) {
            const res = await fetchOnce(false, defaultTimeout, alt);
            return { status: res.status, data: res.data as unknown as JSONValue, fallback: 'wp_rest_route' as const };
          }
        }

        // sonst Originalfehler hochreichen
        throw err;
      }
    } catch (err: unknown) {
      const status = extractHttpStatus(err);
      const msg = extractHttpMessage(err);
      throw new Error(`HTTP GET failed (${status ?? 'no-status'}): ${msg}`);
    }
  },
};

/** Sichere JSON-Pfad-Navigation mit Dot-Path */
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
    'Extrahiert einen Wert aus JSON per einfachem Dot-Path. Input: { json: unknown, path: string }',
  async run(input) {
    const { json, path } = input as { json: unknown; path: string };
    const value = getByPath(json, path);
    return value === undefined
      ? { ok: false, reason: 'path not found', value: null as JSONValue | null }
      : { ok: true, value: value as JSONValue };
  },
};

export const tools: Tool[] = [
  timeTool,
  httpGetTool,
  jsonPickTool,
  ...wooTools, // WooCommerce-Tools
  ...wpTools,  // WordPress-Upload-Tool
];

export function toolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function toolCatalogForSystem(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
}
