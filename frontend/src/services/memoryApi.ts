import type { ApiResponse } from "../types/product";

export interface MemoryStats {
  totalMessages: number;
  memorySize: number;
  lastCleared: number | null;
}

export interface MemoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers = { ...(options.headers as Record<string, string>) };

    // Only set Content-Type for requests with a body
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(endpoint, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

export const memoryApi = {
  getStats: async (): Promise<ApiResponse<MemoryStats>> => {
    return apiRequest<MemoryStats>("/api/system/memory/memory/stats");
  },
  getMessages: async (
    limit = 20,
    offset = 0
  ): Promise<
    ApiResponse<{
      messages: MemoryMessage[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>
  > => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return apiRequest(`/api/system/memory/memory?${params.toString()}`);
  },
  optimize: async (payload: {
    maxEntries?: number;
    ttlSeconds?: number;
  }): Promise<ApiResponse<MemoryStats>> => {
    return apiRequest<MemoryStats>("/api/system/memory/memory/optimize", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  clear: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>("/api/system/memory/memory", {
      method: "DELETE",
    });
  },
};
