// external (values)
import axios, { isAxiosError } from "axios";
import FormData from "form-data";

// builtin (values)
import http from "node:http";
import https from "node:https";

// internal (types first), then external (types)
import type { Tool } from "../types.js";
import type { AxiosRequestConfig } from "axios";

/* ---------------------------------------------------
 * Helpers
 * --------------------------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
const readStr = (obj: unknown, key: string): string | undefined =>
  isRecord(obj) && typeof obj[key] === "string" ? (obj[key] as string) : undefined;
const readNum = (obj: unknown, key: string): number | undefined =>
  isRecord(obj) && typeof obj[key] === "number" ? (obj[key] as number) : undefined;
const hasMessage = (v: unknown): v is { message: string } =>
  isRecord(v) && typeof (v as Record<string, unknown>).message === "string";

function wpBase(): string {
  const url = process.env.WP_URL?.replace(/\/+$/, "") || "";
  if (!url) throw new Error("WP_URL missing in .env");
  return url;
}

// Akzeptiert WP_USERNAME ODER WP_USER (Fallback für ältere .env)
function wpAuthHeader(): string {
  const user = process.env.WP_USERNAME || process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass)
    throw new Error("WP_USERNAME/WP_USER oder WP_APP_PASSWORD fehlen in .env");
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

// Keep-Alive Agents (einmal erstellen)
const KEEP_ALIVE_HTTP = new http.Agent({ keepAlive: true });
const KEEP_ALIVE_HTTPS = new https.Agent({ keepAlive: true });

function axiosErrorToMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    const msg = hasMessage(data) ? data.message : undefined;
    return `${status ?? "no-status"}: ${msg ?? err.message ?? "Axios error"}`;
  }
  return err instanceof Error ? err.message : String(err);
}

function sanitizeFilename(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.-]+/g, "_");
  return cleaned || `upload_${Date.now()}`;
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = wpBase();
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(`${base}/wp-json/${cleanPath}`);
  if (query && isRecord(query)) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/* ---------------------------------------------------
 * Tool: wp_get
 * --------------------------------------------------- */
/**
 * Input: { path: string; query?: Record<string, unknown> }
 * Output: { status: number; data: unknown }
 */
const wpGet: Tool = {
  name: "wp_get",
  description:
    'Generic GET gegen die WP-REST-API. Input: { path:"wp/v2/... (ohne führenden /wp-json)", query? } → { status, data }',
  async run(input) {
    const { path, query } = input as { path: string; query?: Record<string, unknown> };
    if (!path) throw new Error("wp_get: missing path");

    try {
      const res = await axios.get(buildUrl(path, query), {
        timeout: 30000,
        headers: { Authorization: wpAuthHeader() },
        httpAgent: KEEP_ALIVE_HTTP,
        httpsAgent: KEEP_ALIVE_HTTPS,
      });
      return { status: res.status, data: res.data };
    } catch (err) {
      throw new Error(`wp_get failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ---------------------------------------------------
 * Tool: wp_post
 * --------------------------------------------------- */
/**
 * Input: { method:'POST'|'PUT'|'PATCH'|'DELETE', path:string, body?:unknown, query?:Record<string,unknown> }
 * Output: { status:number; data:unknown }
 */
const wpPost: Tool = {
  name: "wp_post",
  description:
    'Generic POST/PUT/PATCH/DELETE gegen die WP-REST-API. Input: { method, path:"wp/v2/...", body?, query? } → { status, data }',
  async run(input) {
    const { method, path, body, query } = input as {
      method: "POST" | "PUT" | "PATCH" | "DELETE";
      path: string;
      body?: unknown;
      query?: Record<string, unknown>;
    };

    if (!method || !path) throw new Error("wp_post: missing method/path");
    const upper = method.toUpperCase() as typeof method;

    try {
      const cfg: AxiosRequestConfig = {
        timeout: 30000,
        headers: {
          Authorization: wpAuthHeader(),
          "Content-Type": "application/json",
        },
        httpAgent: KEEP_ALIVE_HTTP,
        httpsAgent: KEEP_ALIVE_HTTPS,
      };
      const url = buildUrl(path, query);
      const res =
        upper === "DELETE"
          ? await axios.delete(url, cfg)
          : await axios.request({ url, method: upper, data: body ?? {}, ...cfg });

      return { status: res.status, data: res.data };
    } catch (err) {
      throw new Error(`wp_post failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ---------------------------------------------------
 * Tool: wp_media_upload (Base64 → multipart)
 * --------------------------------------------------- */
/**
 * Input: { filename: string; mime: string; data_base64: string; title?: string; alt?: string; description?: string }
 * Output: { id?: number; source_url?: string; status: number }
 */
const wpMediaUpload: Tool = {
  name: "wp_media_upload",
  description:
    "Lädt eine Datei (Base64) in die WordPress-Mediathek hoch (wp/v2/media). Input: { filename, mime, data_base64, title?, alt?, description? } → { id, source_url, status }",
  async run(input) {
    const { filename, mime, data_base64, title, alt, description } = input as {
      filename: string;
      mime: string;
      data_base64: string;
      title?: string;
      alt?: string;
      description?: string;
    };

    if (!filename || !mime || !data_base64) {
      throw new Error("wp_media_upload: missing filename/mime/data_base64");
    }

    const name = sanitizeFilename(filename);
    const binary = Buffer.from(data_base64, "base64");
    const form = new FormData();
    form.append("file", binary, { filename: name, contentType: mime });

    try {
      const upload = await axios.post(`${wpBase()}/wp-json/wp/v2/media`, form, {
        timeout: 300000, // 5 Minuten
        headers: {
          ...form.getHeaders(),
          Authorization: wpAuthHeader(),
          "Content-Disposition": `attachment; filename="${name}"`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpAgent: KEEP_ALIVE_HTTP,
        httpsAgent: KEEP_ALIVE_HTTPS,
      });

      const data = upload.data as unknown;
      const id = readNum(data, "id");
      const source_url = readStr(data, "source_url") ?? undefined;

      if (id && (title || alt || description)) {
        await axios.post(
          `${wpBase()}/wp-json/wp/v2/media/${id}`,
          {
            ...(title ? { title } : {}),
            ...(alt ? { alt_text: alt } : {}),
            ...(description ? { caption: description, description } : {}),
          },
          {
            timeout: 60000,
            headers: { Authorization: wpAuthHeader() },
            httpAgent: KEEP_ALIVE_HTTP,
            httpsAgent: KEEP_ALIVE_HTTPS,
          }
        );
      }

      return { id, source_url, status: upload.status };
    } catch (err) {
      throw new Error(`wp_media_upload failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ---------------------------------------------------
 * Tool: wp_media_upload_from_url
 * --------------------------------------------------- */
/**
 * Input: { file_url: string; filename?: string; mime?: string; title?: string; alt?: string; description?: string }
 * Output: { id?: number; source_url?: string; status:number }
 */
const wpMediaUploadFromUrl: Tool = {
  name: "wp_media_upload_from_url",
  description:
    "Lädt eine Datei von einer externen URL in die WP-Mediathek. Input: { file_url, filename?, mime?, title?, alt?, description? } → { id, source_url, status }",
  async run(input) {
    const { file_url, filename, mime, title, alt, description } = input as {
      file_url: string;
      filename?: string;
      mime?: string;
      title?: string;
      alt?: string;
      description?: string;
    };

    if (!file_url) throw new Error("wp_media_upload_from_url: missing file_url");

    try {
      // Datei holen (längeres Timeout)
      const dl = await axios.get<ArrayBuffer>(file_url, {
        responseType: "arraybuffer",
        timeout: 120000,
        httpAgent: KEEP_ALIVE_HTTP,
        httpsAgent: KEEP_ALIVE_HTTPS,
      });

      const urlName =
        filename || new URL(file_url).pathname.split("/").pop() || `download_${Date.now()}`;
      const name = sanitizeFilename(urlName);
      const contentType =
        mime || (dl.headers["content-type"] as string) || "application/octet-stream";

      // wie bei Base64-Upload
      const form = new FormData();
      form.append("file", Buffer.from(dl.data), { filename: name, contentType });

      const upload = await axios.post(`${wpBase()}/wp-json/wp/v2/media`, form, {
        timeout: 300000, // 5 Minuten
        headers: {
          ...form.getHeaders(),
          Authorization: wpAuthHeader(),
          "Content-Disposition": `attachment; filename="${name}"`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpAgent: KEEP_ALIVE_HTTP,
        httpsAgent: KEEP_ALIVE_HTTPS,
      });

      const data = upload.data as unknown;
      const id = readNum(data, "id");
      const source_url = readStr(data, "source_url") ?? undefined;

      if (id && (title || alt || description)) {
        await axios.post(
          `${wpBase()}/wp-json/wp/v2/media/${id}`,
          {
            ...(title ? { title } : {}),
            ...(alt ? { alt_text: alt } : {}),
            ...(description ? { caption: description, description } : {}),
          },
          {
            timeout: 60000,
            headers: { Authorization: wpAuthHeader() },
            httpAgent: KEEP_ALIVE_HTTP,
            httpsAgent: KEEP_ALIVE_HTTPS,
          }
        );
      }

      return { id, source_url, status: upload.status };
    } catch (err) {
      throw new Error(`wp_media_upload_from_url failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ---------------------------------------------------
 * Tool: wp_set_media_meta
 * --------------------------------------------------- */
/**
 * Input: { id:number; title?:string; alt?:string; caption?:string; description?:string }
 * Output: { status:number; data:unknown }
 */
const wpSetMediaMeta: Tool = {
  name: "wp_set_media_meta",
  description:
    "Aktualisiert Metadaten eines Media-Objekts. Input: { id, title?, alt?, caption?, description? } → { status, data }",
  async run(input) {
    const { id, title, alt, caption, description } = input as {
      id: number;
      title?: string;
      alt?: string;
      caption?: string;
      description?: string;
    };
    if (!id) throw new Error("wp_set_media_meta: missing id");

    try {
      const res = await axios.post(
        `${wpBase()}/wp-json/wp/v2/media/${id}`,
        {
          ...(title ? { title } : {}),
          ...(alt ? { alt_text: alt } : {}),
          ...(caption ? { caption } : {}),
          ...(description ? { description } : {}),
        },
        {
          timeout: 20000,
          headers: { Authorization: wpAuthHeader() },
          httpAgent: KEEP_ALIVE_HTTP,
          httpsAgent: KEEP_ALIVE_HTTPS,
        }
      );
      return { status: res.status, data: res.data };
    } catch (err) {
      throw new Error(`wp_set_media_meta failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

/* ---------------------------------------------------
 * Export
 * --------------------------------------------------- */

export const wpTools: Tool[] = [wpGet, wpPost, wpMediaUpload, wpMediaUploadFromUrl, wpSetMediaMeta];
export { wpGet, wpPost, wpMediaUpload, wpMediaUploadFromUrl, wpSetMediaMeta };
