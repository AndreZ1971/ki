import axios from 'axios';

import type { Tool } from '../types.js';

export const timeTool: Tool = {
  name: 'time_now',
  description: 'Gibt die aktuelle ISO-Zeit zurück.',
  async run() {
    return { now: new Date().toISOString() };
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function extractHttpStatus(e: unknown): number | undefined {
  if (isRecord(e) && isRecord(e.response)) {
    const s = e.response.status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function extractHttpMessage(e: unknown): string {
  if (isRecord(e)) {
    const resp = e.response;
    if (isRecord(resp)) {
      const data = resp.data;
      if (isRecord(data) && typeof data.message === 'string') return data.message;
    }
    if (typeof e.message === 'string') return e.message;
  }
  return String(e);
}

export const httpGetTool: Tool = {
  name: 'http_get',
  description:
    'HTTP GET (JSON erwartet). Input: { url: string, headers?: Record<string,string> }',
  async run(input) {
    const { url, headers } = input as {
      url: string;
      headers?: Record<string, string>;
    };

    // GitHub-Token nur verwenden, wenn es plausibel aussieht
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
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(headers ?? {}),
    };

    const fetchOnce = async (useAuth: boolean) =>
      axios.get(url, {
        timeout: 10000,
        headers: {
          ...baseHeaders,
          ...(useAuth && looksLikeGhToken ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

    try {
      // 1) Mit Auth (wenn plausibel) → bei 401/403 automatisch ohne Auth erneut
      if (looksLikeGhToken) {
        try {
          const res = await fetchOnce(true);
          return { status: res.status, data: res.data, authed: true as const };
        } catch (err: unknown) {
          const status = extractHttpStatus(err);
          if (status === 401 || status === 403) {
            const res = await fetchOnce(false);
            return { status: res.status, data: res.data, authed: false as const, fallback: true as const };
          }
          throw err;
        }
      }

      // 2) Ohne Auth
      const res = await fetchOnce(false);
      return { status: res.status, data: res.data, authed: false as const };
    } catch (err: unknown) {
      const status = extractHttpStatus(err);
      const msg = extractHttpMessage(err);
      throw new Error(`HTTP GET failed (${status ?? 'no-status'}): ${msg}`);
    }
  },
};

/** Sichere JSON-Pfad-Navigation mit Dot-Path (z. B. "stargazers_count" oder "owner.login"). */
function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const key of parts) {
    if (!isRecord(cur) || !(key in cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

export const jsonPickTool: Tool = {
  name: 'json_pick',
  description:
    'Extrahiert einen Wert aus JSON per einfachem Dot-Path. Input: { json: unknown, path: string }',
  async run(input) {
    const { json, path } = input as { json: unknown; path: string };
    const value = getByPath(json, path);
    return value === undefined
      ? { ok: false, reason: 'path not found', value: null }
      : { ok: true, value };
  },
};

export const tools: Tool[] = [timeTool, httpGetTool, jsonPickTool];

export function toolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function toolCatalogForSystem(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
}
