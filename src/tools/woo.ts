import axios, { isAxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

import type { Tool } from '../types.js';

/**
 * Woo REST-Client
 * Auth: Basic (Consumer Key/Secret), BaseURL: {WOO_URL}/wp-json/wc/v3
 */
function createWooClient(): AxiosInstance {
  const base = process.env.WOO_URL?.replace(/\/+$/, '') || '';
  const key = process.env.WOO_KEY || '';
  const secret = process.env.WOO_SECRET || '';

  if (!base || !key || !secret) {
    throw new Error('Woo config missing: WOO_URL, WOO_KEY, WOO_SECRET must be set in .env');
  }

  const baseURL = `${base}/wp-json/wc/v3`;

  return axios.create({
    baseURL,
    timeout: 15000,
    auth: { username: key, password: secret },
    headers: {
      'user-agent': 'ki-agent',
      accept: 'application/json',
      'content-type': 'application/json',
    },
  });
}

function pathNormalize(p: string): string {
  return p.startsWith('/') ? p : `/${p}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function axiosErrorToMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    let msgFromData: string | undefined;
    if (isRecord(data) && typeof data.message === 'string') {
      msgFromData = data.message;
    }
    const msg = msgFromData ?? err.message ?? 'Axios error';
    return `${status ?? 'no-status'}: ${msg}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/* ----------------------- Basis-Tools ----------------------- */

const wooGet: Tool = {
  name: 'woo_get',
  description:
    'GET auf WooCommerce REST. Input: { path: string, params?: Record<string,string|number> }',
  async run(input) {
    const { path, params } = input as {
      path: string;
      params?: Record<string, string | number>;
    };
    const client = createWooClient();
    try {
      const res = await client.get(pathNormalize(path), { params });
      return { status: res.status, data: res.data };
    } catch (err) {
      throw new Error(`woo_get failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

const wooPost: Tool = {
  name: 'woo_post',
  description:
    'POST/PATCH auf WooCommerce REST. Input: { path: string, method?: "post"|"patch", body?: unknown }',
  async run(input) {
    const { path, method = 'post', body } = input as {
      path: string;
      method?: 'post' | 'patch';
      body?: unknown;
    };
    const client = createWooClient();
    try {
      const url = pathNormalize(path);
      const res =
        method === 'patch'
          ? await client.patch(url, body ?? {})
          : await client.post(url, body ?? {});
      return { status: res.status, data: res.data };
    } catch (err) {
      throw new Error(`woo_post failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

const wooListOrdersSince: Tool = {
  name: 'woo_list_orders_since',
  description:
    'Listet Bestellungen seit ISO-Zeitpunkt. Input: { since: string, per_page?: number, max_pages?: number }',
  async run(input) {
    const { since, per_page = 50, max_pages = 5 } = input as {
      since: string;
      per_page?: number;
      max_pages?: number;
    };
    const client = createWooClient();

    const all: unknown[] = [];
    try {
      for (let page = 1; page <= max_pages; page++) {
        const res = await client.get('/orders', {
          params: { after: since, per_page, page, orderby: 'date', order: 'asc' },
        });
        const chunk = Array.isArray(res.data) ? (res.data as unknown[]) : [];
        all.push(...chunk);
        if (chunk.length < per_page) break;
      }
      return { count: all.length, orders: all };
    } catch (err) {
      throw new Error(`woo_list_orders_since failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

const wooUpdateStock: Tool = {
  name: 'woo_update_stock',
  description: 'Setzt Lagerbestand. Input: { product_id: number, stock_quantity: number }',
  async run(input) {
    const { product_id, stock_quantity } = input as {
      product_id: number;
      stock_quantity: number;
    };
    const client = createWooClient();
    try {
      const res = await client.patch(`/products/${product_id}`, {
        manage_stock: true,
        stock_quantity,
        stock_status: stock_quantity > 0 ? 'instock' : 'outofstock',
      });
      const data = res.data as unknown;
      const id = isRecord(data) && typeof data.id === 'number' ? data.id : undefined;
      const stock =
        isRecord(data) && typeof data.stock_quantity === 'number'
          ? data.stock_quantity
          : undefined;
      return { status: res.status, id, stock };
    } catch (err) {
      throw new Error(`woo_update_stock failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ----------------------- Komfort-Tools für Freebies ----------------------- */

type WooCategory = { id: number; name: string; slug: string };

const wooFindCategoryId: Tool = {
  name: 'woo_find_category_id',
  description:
    'Findet die Kategorie-ID per Name. Input: { name: string } → { ok, id?, name?, slug?, candidates? }',
  async run(input) {
    const { name } = input as { name: string };
    const client = createWooClient();

    try {
      const res = await client.get('/products/categories', {
        params: { search: name, per_page: 100, hide_empty: false },
      });
      const arr = Array.isArray(res.data) ? (res.data as unknown[]) : [];

      // Nur gültige Kategorien herausfiltern
      const candidates: WooCategory[] = [];
      for (const it of arr) {
        if (
          isRecord(it) &&
          typeof it.id === 'number' &&
          typeof it.name === 'string' &&
          typeof it.slug === 'string'
        ) {
          candidates.push({ id: it.id, name: it.name, slug: it.slug });
        }
      }

      const found =
        candidates.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
        candidates.find((c) => c.slug.toLowerCase() === name.toLowerCase());

      if (!found) {
        return { ok: false, reason: `Category "${name}" not found`, candidates };
      }
      return { ok: true, id: found.id, name: found.name, slug: found.slug };
    } catch (err) {
      throw new Error(`woo_find_category_id failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

type DownloadItem = { name: string; file: string };

const wooCreateFreebie: Tool = {
  name: 'woo_create_freebie',
  description:
    'Erstellt ein kostenloses, virtuelles, downloadbares Produkt. Input: { title, short_description, description, category_id, downloads: Array<{name,file}>, tags?: string[], images?: Array<{src,alt?}> }',
  async run(input) {
    const {
      title,
      short_description,
      description,
      category_id,
      downloads,
      tags = [],
      images = [],
    } = input as {
      title: string;
      short_description: string;
      description: string;
      category_id: number;
      downloads: DownloadItem[];
      tags?: string[];
      images?: { src: string; alt?: string }[];
    };

    if (!title || !category_id || !Array.isArray(downloads) || downloads.length === 0) {
      throw new Error('woo_create_freebie: missing title/category_id/downloads');
    }

    const client = createWooClient();

    const productPayload = {
      name: title,
      type: 'simple',
      status: 'publish',
      regular_price: '0',
      tax_status: 'none',
      virtual: true,
      downloadable: true,
      short_description,
      description,
      categories: [{ id: category_id }],
      tags: tags.map((t) => ({ name: t })),
      images,
      downloads: downloads.map((d) => ({ name: d.name, file: d.file })),
      download_limit: -1,
      download_expiry: -1,
      manage_stock: false,
      stock_status: 'instock',
    };

    try {
      const res = await client.post('/products', productPayload);
      const p = res.data as unknown;
      const id = isRecord(p) && typeof p.id === 'number' ? p.id : undefined;
      const slug = isRecord(p) && typeof p.slug === 'string' ? p.slug : undefined;
      const permalink =
        isRecord(p) && typeof p.permalink === 'string' ? p.permalink : undefined;

      return { id, slug, permalink, status: res.status };
    } catch (err) {
      throw new Error(`woo_create_freebie failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ----------------------- Export-Katalog ----------------------- */

export const wooTools: Tool[] = [
  wooGet,
  wooPost,
  wooListOrdersSince,
  wooUpdateStock,
  wooFindCategoryId,
  wooCreateFreebie,
];

// Zusätzlich: Named Exports, damit `import { wooPost } from "../../tools/woo"` funktioniert
export { wooGet, wooPost };
