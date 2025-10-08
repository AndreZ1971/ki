import axios from "axios";
import type { AxiosInstance } from "axios";

import type { Tool } from "../types.js";

/**
 * Erstellt einen vorkonfigurierten WooCommerce-Client
 */
function client(): AxiosInstance {
  const baseURL = process.env.WOO_URL?.replace(/\/+$/, "");
  const key = process.env.WOO_KEY;
  const secret = process.env.WOO_SECRET;

  if (!baseURL || !key || !secret) {
    throw new Error("WOO_URL, WOO_KEY oder WOO_SECRET sind nicht gesetzt!");
  }

  return axios.create({
    baseURL: `${baseURL}/wp-json/wc/v3`,
    auth: { username: key, password: secret },
    timeout: 15000,
    headers: {
      "user-agent": "ki-agent",
      accept: "application/json",
    },
  });
}

/**
 * 1) Allgemeines GET-Tool
 * Input: { path: string, params?: Record<string,string|number|boolean> }
 */
export const wooGetTool: Tool = {
  name: "woo_get",
  description:
    "WooCommerce GET. Input: { path: string, params?: Record<string,string|number|boolean> }",
  async run(input) {
    const { path, params } = input as {
      path: string;
      params?: Record<string, string | number | boolean>;
    };

    const res = await client().get(path, { params });
    return { status: res.status, data: res.data };
  },
};

/**
 * 2) POST / PATCH-Tool
 * Input: { path: string, data: unknown, method?: 'post' | 'patch' }
 */
export const wooPostTool: Tool = {
  name: "woo_post",
  description:
    "WooCommerce POST/PATCH. Input: { path: string, data: unknown, method?: 'post' | 'patch' }",
  async run(input) {
    const { path, data, method } = input as {
      path: string;
      data: unknown;
      method?: "post" | "patch";
    };

    const http = client();
    const m = method ?? "post";
    const res = await http[m](path, data);
    return { status: res.status, data: res.data };
  },
};

/**
 * 3) Bestellungen seit bestimmtem ISO-Zeitpunkt abrufen
 * Input: { sinceIso: string }
 */
export const wooListOrdersSince: Tool = {
  name: "woo_list_orders_since",
  description:
    "Listet Bestellungen seit ISO-Zeitpunkt. Input: { sinceIso: string }",
  async run(input) {
    const { sinceIso } = input as { sinceIso: string };

    const res = await client().get("/orders", {
      params: {
        after: sinceIso, // ISO 8601
        per_page: 50,
        orderby: "date",
        order: "asc",
        status: "processing,completed,pending",
      },
    });
    return { status: res.status, data: res.data };
  },
};

/**
 * 4) Lagerbestand eines Produkts anpassen
 * Input: { productId: number, stockQuantity: number }
 */
export const wooUpdateStock: Tool = {
  name: "woo_update_stock",
  description:
    "Setzt Lagerbestand. Input: { productId: number, stockQuantity: number }",
  async run(input) {
    const { productId, stockQuantity } = input as {
      productId: number;
      stockQuantity: number;
    };

    const res = await client().put(`/products/${productId}`, {
      stock_quantity: stockQuantity,
      manage_stock: true,
    });
    return { status: res.status, data: res.data };
  },
};

/** Export-Sammelliste für tools.ts */
export const wooTools: Tool[] = [
  wooGetTool,
  wooPostTool,
  wooListOrdersSince,
  wooUpdateStock,
];


