import axios, { isAxiosError } from 'axios';

import { wooTools } from '../tools/woo.js';
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
    const d = e.response?.data;
    const msgFromData =
      isRecord(d) && typeof d.message === 'string' ? (d.message as string) : undefined;
    return msgFromData ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

export const httpGetTool: Tool = {
  name: 'http_get',
  description: 'HTTP GET (JSON erwartet). Input: { url: string, headers?: Record<string,string> }',
  async run(input) {
    const { url, headers } = input as {
      url: string;
      headers?: Record<string, string>;
    };

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
      if (looksLikeGhToken) {
        try {
          const res = await fetchOnce(true);
          return { status: res.status, data: res.data as unknown as JSONValue, authed: true as const };
        } catch (err: unknown) {
          const status = extractHttpStatus(err);
          if (status === 401 || status === 403) {
            const res = await fetchOnce(false);
            return {
              status: res.status,
              data: res.data as unknown as JSONValue,
              authed: false as const,
              fallback: true as const,
            };
          }
          throw err;
        }
      }

      const res = await fetchOnce(false);
      return { status: res.status, data: res.data as unknown as JSONValue, authed: false as const };
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
  description: 'Extrahiert einen Wert aus JSON per einfachem Dot-Path. Input: { json: unknown, path: string }',
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
  ...wooTools, // WooCommerce-Tools integrieren
];

export function toolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function toolCatalogForSystem(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
}
