import axios, { isAxiosError } from 'axios';
import FormData from 'form-data';

import type { Tool } from '../types.js';


function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function wpBase(): string {
  const url = process.env.WP_URL?.replace(/\/+$/, '') || '';
  if (!url) throw new Error('WP_URL missing in .env');
  return url;
}

function wpAuthHeader(): string {
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass) throw new Error('WP_USER / WP_APP_PASSWORD missing in .env');
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

function axiosErrorToMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    let msg: string | undefined;
    if (isRecord(data) && typeof data.message === 'string') msg = data.message;
    return `${status ?? 'no-status'}: ${msg ?? err.message ?? 'Axios error'}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Tool: wp_media_upload
 * Input: { filename: string; mime: string; data_base64: string; title?: string; alt?: string; description?: string }
 * Output: { id?: number; source_url?: string; status: number }
 */
const wpMediaUpload: Tool = {
  name: 'wp_media_upload',
  description:
    'Lädt eine Datei in die WordPress-Mediathek hoch (wp/v2/media). Input: { filename, mime, data_base64, title?, alt?, description? } → { id, source_url }',
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
      throw new Error('wp_media_upload: missing filename/mime/data_base64');
    }

    const binary = Buffer.from(data_base64, 'base64');
    const form = new FormData();
    form.append('file', binary, { filename, contentType: mime });

    try {
      const upload = await axios.post(`${wpBase()}/wp-json/wp/v2/media`, form, {
        timeout: 30000,
        headers: {
          ...form.getHeaders(),
          Authorization: wpAuthHeader(),
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const data = upload.data as unknown;
      const id = isRecord(data) && typeof data.id === 'number' ? data.id : undefined;
      const source_url =
        isRecord(data) && typeof data.source_url === 'string' ? (data.source_url as string) : undefined;

      // Optional: Metadaten nachtragen
      if (id && (title || alt || description)) {
        await axios.post(
          `${wpBase()}/wp-json/wp/v2/media/${id}`,
          {
            ...(title ? { title } : {}),
            ...(alt ? { alt_text: alt } : {}),
            ...(description ? { caption: description, description } : {}),
          },
          { headers: { Authorization: wpAuthHeader() } }
        );
      }

      return { id, source_url, status: upload.status };
    } catch (err) {
      throw new Error(`wp_media_upload failed: ${axiosErrorToMessage(err)}`);
    }
  },
};

export const wpTools: Tool[] = [wpMediaUpload];
