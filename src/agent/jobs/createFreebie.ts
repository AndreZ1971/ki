// src/agent/jobs/createFreebie.ts
// Legt ein echtes WooCommerce-Download-Produkt an (Kategorie z.B. 15 = Freebies)
// - lädt ZIP & optionales Cover ins WP-Medienarchiv (via Tool.run)
// - setzt Produkt als "virtual" + "downloadable"
// - verknüpft den Medienlink sauber über WooCommerce "downloads"

import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";

import { wpMediaUpload } from "../../tools/wp";

// =======================
// Typen
// =======================
export type CreateFreebieOpts = {
  /** Lokaler Pfad zur ZIP (mit echtem Inhalt) */
  zipPath: string;
  /** Optional: lokaler Pfad zu einem Produktbild (Cover) */
  coverPath?: string;
  /** WooCommerce-Kategorie-ID (z.B. 15 = Freebies) */
  categoryId: number;
  /** Produktname (erscheint im Katalog) */
  name: string;
  /** Optionaler Slug – wird sonst aus dem Namen generiert */
  slug?: string;
  /** Kurze Beschreibung (HTML erlaubt) */
  shortDesc: string;
  /** Lange Beschreibung für SEO (HTML) */
  longDesc: string;
  /** Optionale Tags */
  tags?: string[];
  /** Preis als String; Standard "0" (Freebie) */
  price?: string;
};

type WPAttachment = { id: number; source_url: string };

// =======================
// Helpers
// =======================
function makeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Akzente entfernen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ensureHtml(s: string): string {
  const trimmed = (s ?? "").trim();
  return trimmed.length ? trimmed : "<p></p>";
}

function guessMimeByExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".zip":
      return "application/zip";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function wcApiBase() {
  // Erwartete ENV-Variablen:
  // WC_API_URL z.B. https://kaufe-es.eu/index.php
  // WC_CONSUMER_KEY / WC_CONSUMER_SECRET
  const base = process.env.WC_API_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("ENV WC_API_URL fehlt.");
  const url = `${base}/wp-json/wc/v3`;
  const ck = process.env.WC_CONSUMER_KEY;
  const cs = process.env.WC_CONSUMER_SECRET;
  if (!ck || !cs) throw new Error("ENV WC_CONSUMER_KEY / WC_CONSUMER_SECRET fehlen.");
  return { url, ck, cs };
}
 
async function wooRequest<T = any>(
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH",
  path: string,
   
  data?: any,
   
  params?: Record<string, any>
) {
  const { url, ck, cs } = wcApiBase();
  const full = `${url}${path}`;
  const res = await axios.request<T>({
    method,
    url: full,
    data,
    params: { consumer_key: ck, consumer_secret: cs, ...(params || {}) },
  });
  return res.data as T;
}

/**
 * Lädt eine lokale Datei via Tool.run ins WP-Medienarchiv
 * und gibt {id, source_url} robust zurück.
 */
async function uploadViaTool(filePath: string, title: string, alt?: string): Promise<WPAttachment> {
  const filename = path.basename(filePath);
  const mime = guessMimeByExt(filename);
  const buf = await fs.readFile(filePath);
  const data_base64 = buf.toString("base64");

  const res: any = await wpMediaUpload.run({
    filename,
    mime,
    data_base64,
    title,
    alt: alt ?? title,
  });

  // Sowohl reine Attachment-Response als auch {status, data}-Wrapper tolerieren
  const payload = res?.data ?? res;
  const id = payload?.id;
  const source_url =
    payload?.source_url ??
    payload?.guid?.rendered ??
    payload?.url;

  if (!id || !source_url) {
    throw new Error(`Unerwartete Medien-Upload-Response: ${JSON.stringify(res).slice(0, 500)}`);
  }
  return { id, source_url };
}

// =======================
// Hauptfunktion
// =======================
/**
 * Legt ein downloadbares Produkt an und verknüpft eine hochgeladene ZIP-Datei.
 * @returns Die von WooCommerce zurückgegebene Produkt-Response (Produktobjekt)
 */
export async function createDownloadFreebie(opts: CreateFreebieOpts) {
  const {
    zipPath,
    coverPath,
    categoryId,
    name,
    slug,
    shortDesc,
    longDesc,
    tags = [],
    price = "0",
  } = opts;

  if (!zipPath) throw new Error("zipPath fehlt.");
  if (!categoryId) throw new Error("categoryId fehlt.");
  if (!name) throw new Error("name fehlt.");

  // 1) ZIP hochladen (via Tool.run)
  const zip: WPAttachment = await uploadViaTool(zipPath, `${name} – ZIP`);

  // 2) Optional Cover hochladen
  let imageId: number | undefined;
  if (coverPath) {
    const img: WPAttachment = await uploadViaTool(coverPath, `${name} – Cover`);
    imageId = img.id;
  }

  // 3) Produkt-Payload zusammenbauen
   
  const payload: any = {
    name,
    slug: slug ? makeSlug(slug) : makeSlug(name),
    type: "simple",
    status: "publish",
    virtual: true,
    downloadable: true,
    price,
    regular_price: price,
    download_limit: -1,
    download_expiry: -1,
    categories: [{ id: categoryId }],
    short_description: ensureHtml(shortDesc),
    description: ensureHtml(longDesc),
    downloads: [
      {
        name: `${name} (ZIP)`,
        file: zip.source_url, // URL aus dem Medien-Upload
      },
    ],
    // Tags können per Name übergeben werden; Woo legt sie ggf. an
    ...(tags.length ? { tags: tags.map((t) => ({ name: t })) } : {}),
  };

  if (imageId) {
    payload.images = [{ id: imageId }];
  }

  // 4) Produkt anlegen
   
  const product = await wooRequest<any>("POST", "/products", payload);

  return product;
}
