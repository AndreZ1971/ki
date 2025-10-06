import axios from 'axios';
import type { Tool } from '../types.js';

export const timeTool: Tool = {
  name: 'time_now',
  description: 'Gibt die aktuelle ISO-Zeit zurück.',
  async run() {
    return { now: new Date().toISOString() };
  },
};

export const httpGetTool: Tool = {
  name: 'http_get',
  description: 'HTTP GET (JSON erwartet). Input: { url: string }',
  async run(input) {
    const { url } = input;
    const res = await axios.get(url, { timeout: 10000 });
    return { status: res.status, data: res.data };
  },
};

export const tools: Tool[] = [timeTool, httpGetTool];

export function toolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function toolCatalogForSystem(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
}
