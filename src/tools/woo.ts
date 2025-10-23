// src/tools/woo.ts
// Robuste WooCommerce-REST-Wrapper + optionale Tool-Objekte
//
// Erwartete ENV-Variablen:
//   WOO_URL         = https://example.com
//   WOO_KEY         = ck_xxxxxxx
//   WOO_SECRET      = cs_xxxxxxx
//   WOO_AUTH_MODE   = basic | query   (optional, default: basic)
//   WOO_TIMEOUT_MS  = 30000           (optional)

import axios, { isAxiosError, type AxiosInstance } from "axios";
import type { Tool } from "../types.js";

/* ───────────────────────── Helpers & Client ───────────────────────── */

const AUTH_MODE = (process.env.WOO_AUTH_MODE ?? "basic").toLowerCase();
const TIMEOUT_MS = Number(process.env.WOO_TIMEOUT_MS ?? 30000);

function createWooClient(): AxiosInstance {
  const base = process.env.WOO_URL?.replace(/\/+$/, "") || "";
  const key = process.env.WOO_KEY || "";
  const secret = process.env.WOO_SECRET || "";

  if (!base || !key || !secret) {
    throw new Error("Woo config missing: WOO_URL, WOO_KEY, WOO_SECRET must be set in .env");
  }

  const baseURL = `${base}/wp-json/wc/v3`;

  const common = {
    baseURL,
    timeout: TIMEOUT_MS,
    headers: {
      "user-agent": "ki-agent",
      accept: "application/json",
      "content-type": "application/json",
    },
  } as const;

  if (AUTH_MODE === "basic") {
    return axios.create({
      ...common,
      auth: { username: key, password: secret },
    });
  }

  // AUTH_MODE === "query": Auth über Query-Params (stabil hinter Proxies/CDNs)
  return axios.create({ ...common });
}

function pathNormalize(p: string): string {
  return p.startsWith("/") ? p : `/${p}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function axiosErrorToMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    let msgFromData: string | undefined;
    if (isRecord(data) && typeof data.message === "string") {
      msgFromData = data.message;
    }
    const msg = msgFromData ?? err.message ?? "Axios error";
    return `${status ?? "no-status"}: ${msg}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/* ─────────────────────── Named Function Exports ───────────────────────
   Diese Funktionen werden von src/agent/tools.ts direkt importiert:
     import { wooGet, wooPost } from "../tools/woo.js"
*/

export async function wooGet(
  path: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const client = createWooClient();
  const url = pathNormalize(path);

  // Bei query-Auth Schlüssel als Query-Parameter mitsenden
  const qp =
    AUTH_MODE === "query"
      ? {
          consumer_key: process.env.WOO_KEY,
          consumer_secret: process.env.WOO_SECRET,
          ...params,
        }
      : params;

  try {
    const res = await client.get(url, { params: qp });
    return res.data;
  } catch (err) {
    throw new Error(`woo_get failed: ${axiosErrorToMessage(err)}`);
  }
}

export async function wooPost(
  path: string,
  data: Record<string, unknown> = {},
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const client = createWooClient();
  const url = pathNormalize(path);

  // Optional Override via params.__method = "post" | "put" | "patch"
  const override =
    typeof params.__method === "string" ? params.__method.toLowerCase() : undefined;

  // Heuristik: /products/123 → PUT, sonst POST
  const inferred = /^\/[^?]+\/\d+($|[/?#])/i.test(url) ? "put" : "post";
  const method = (override ?? inferred) as "post" | "put" | "patch";

  // __method nicht an Woo senden
  const { __method, ...restParams } = params as Record<string, unknown>;

  // Bei query-Auth Schlüssel als Query-Parameter mitsenden
  const qp =
    AUTH_MODE === "query"
      ? {
          consumer_key: process.env.WOO_KEY,
          consumer_secret: process.env.WOO_SECRET,
          ...restParams,
        }
      : restParams;

  try {
    if (method === "put") {
      const res = await client.put(url, data ?? {}, { params: qp });
      return res.data;
    } else if (method === "patch") {
      const res = await client.patch(url, data ?? {}, { params: qp });
      return res.data;
    } else {
      const res = await client.post(url, data ?? {}, { params: qp });
      return res.data;
    }
  } catch (err) {
    throw new Error(`woo_post failed: ${axiosErrorToMessage(err)}`);
  }
}

/* ───────────────────────── Tool Objects (optional) ─────────────────────────
   Falls du woo_* auch als Tool direkt registrieren möchtest,
   gibt es hier passende Tool-Objekte, die auf die Funktionen oben mappen.
*/

const wooGetTool: Tool = {
  name: "woo_get",
  description:
    "GET auf WooCommerce REST. Input: { path: string, params?: Record<string,unknown> }",
  async run(input) {
    const { path, params } = input as {
      path: string;
      params?: Record<string, unknown>;
    };
    return await wooGet(path, params ?? {});
  },
};

const wooPostTool: Tool = {
  name: "woo_post",
  description:
    "POST/PUT/PATCH auf WooCommerce REST. Input: { path: string, data?: Record<string,unknown>, params?: Record<string,unknown> }",
  async run(input) {
    const { path, data, params } = input as {
      path: string;
      data?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };
    return await wooPost(path, data ?? {}, params ?? {});
  },
};

/* ─────────── Zusätzliche Tools (optional, Beispiel) ─────────── */

const wooListOrdersSince: Tool = {
  name: "woo_list_orders_since",
  description:
    "Listet Bestellungen seit ISO-Zeitpunkt. Input: { since: string, per_page?: number, max_pages?: number }",
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
        const res = await client.get("/orders", {
          params:
            AUTH_MODE === "query"
              ? {
                  consumer_key: process.env.WOO_KEY,
                  consumer_secret: process.env.WOO_SECRET,
                  after: since,
                  per_page,
                  page,
                  orderby: "date",
                  order: "asc",
                }
              : { after: since, per_page, page, orderby: "date", order: "asc" },
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
  name: "woo_update_stock",
  description: "Setzt Lagerbestand. Input: { product_id: number, stock_quantity: number }",
  async run(input) {
    const { product_id, stock_quantity } = input as {
      product_id: number;
      stock_quantity: number;
    };
    const client = createWooClient();
    try {
      const params =
        AUTH_MODE === "query"
          ? {
              consumer_key: process.env.WOO_KEY,
              consumer_secret: process.env.WOO_SECRET,
            }
          : undefined;

      const res = await client.patch(
        `/products/${product_id}`,
        {
          manage_stock: true,
          stock_quantity,
          stock_status: stock_quantity > 0 ? "instock" : "outofstock",
        },
        { params }
      );
      const data = res.data as unknown;
      const id =
        isRecord(data) && typeof (data as Record<string, unknown>).id === "number"
          ? (data as Record<string, unknown>).id
          : undefined;
      const stock =
        isRecord(data) && typeof (data as Record<string, unknown>).stock_quantity === "number"
          ? (data as Record<string, unknown>).stock_quantity
          : undefined;
      return { status: res.status, id, stock };
    } catch (err) {
      throw new Error(`woo_update_stock failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ───────────────────────── Exporte ───────────────────────── */

export const wooTools: Tool[] = [
  wooGetTool,
  wooPostTool,
  wooListOrdersSince,
  wooUpdateStock,
];

// Named Exports für direkte Funktionsverwendung:
export { wooGetTool, wooPostTool };
