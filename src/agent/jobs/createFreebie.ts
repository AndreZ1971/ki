// src/agent/jobs/createFreebie.ts
// Legt ein echtes WooCommerce-Download-Produkt an (Kategorie z.B. 15 = Freebies)
// - lädt ZIP & optionales Cover ins WP-Medienarchiv (via Tool.run)
// - setzt Produkt als "virtual" + "downloadable"
// - verknüpft den Medienlink sauber über WooCommerce "downloads"

// external
import axios from "axios";

// builtin
import fs from "node:fs/promises";
import path from "node:path";

// internal
import { wpMediaUpload } from "../../tools/wp";

// =======================
// Typen
// =======================
type StringMap = Record<string, string | number | boolean | undefined>;

export type WooProduct = { id: number; name: string; slug: string };
type WooProductCreatePayload = {
  name: string;
  slug: string;
  type: "simple";
  status: "publish";
  virtual: true;
  downloadable: true;
  price: string;
  regular_price: string;
  download_limit: number; // -1 = unlimitiert
  download_expiry: number; // -1 = nie
  categories: { id: number }[];
  short_description: string;
  description: string;
  downloads: { name: string; file: string }[];
  images?: { id: number }[];
  tags?: { name: string }[];
};

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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
const readStr = (obj: unknown, key: string): string | undefined =>
  isRecord(obj) && typeof obj[key] === "string" ? (obj[key] as string) : undefined;
const readNum = (obj: unknown, key: string): number | undefined =>
  isRecord(obj) && typeof obj[key] === "number" ? (obj[key] as number) : undefined;

// =======================
// Woo API Helper
// =======================
function wcApiBase() {
  // Erwartete ENV-Variablen:
  // WC_API_URL z.B. https://example.com oder https://example.com/index.php
  // WC_CONSUMER_KEY / WC_CONSUMER_SECRET
  const base = process.env.WC_API_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("ENV WC_API_URL fehlt.");
  const url = `${base}/wp-json/wc/v3`;
  const ck = process.env.WC_CONSUMER_KEY;
  const cs = process.env.WC_CONSUMER_SECRET;
  if (!ck || !cs) throw new Error("ENV WC_CONSUMER_KEY / WC_CONSUMER_SECRET fehlen.");
  return { url, ck, cs };
}

async function wooRequest<T>(
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH",
  path: string,
  data?: unknown,
  params?: StringMap
) {
  const { url, ck, cs } = wcApiBase();
  const full = `${url}${path}`;
  const res = await axios.request<T>({
    method,
    url: full,
    data: data ?? {},
    params: { consumer_key: ck, consumer_secret: cs, ...(params ?? {}) },
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

  const res: unknown = await wpMediaUpload.run({
    filename,
    mime,
    data_base64,
    title,
    alt: alt ?? title,
  });

  // Sowohl reine Attachment-Response als auch {status, data}-Wrapper tolerieren
  const payload = isRecord(res) && "data" in res ? (res as { data: unknown }).data : res;
  const id = readNum(payload, "id");
  const source_url =
    readStr(payload, "source_url") ??
    (isRecord(payload) && isRecord(payload.guid) ? readStr(payload.guid, "rendered") : undefined) ??
    readStr(payload, "url");

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
  const payload: WooProductCreatePayload = {
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
    ...(tags.length ? { tags: tags.map((t) => ({ name: t })) } : {}),
  };

  if (imageId) {
    payload.images = [{ id: imageId }];
  }

  // 4) Produkt anlegen
  const product = await wooRequest<WooProduct>("POST", "/products", payload);

  return product;
}
