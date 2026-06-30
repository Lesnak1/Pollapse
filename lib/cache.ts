/**
 * Shared Vercel KV Cache with local in-memory fallback.
 * Used server-side in API routes to avoid rate limiting.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Zero-dependency REST KV Client
async function kvRequest(command: string, args: any[] = []): Promise<any> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Vercel KV REST response error status:', res.status);
      return null;
    }
    const data = await res.json();
    return data.result;
  } catch (e) {
    console.error('Vercel KV Redis error:', e);
    return null;
  }
}

class SharedCache {
  private store: Map<string, CacheEntry<any>>;

  constructor() {
    this.store = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    if (isVercelKV) {
      const dataStr = await kvRequest('GET', [key]);
      if (dataStr === null || dataStr === undefined) return null;
      try {
        return typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      } catch {
        return dataStr as any;
      }
    } else {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }
      return entry.value as T;
    }
  }

  async set<T>(key: string, value: T, ttlMs = 60000): Promise<void> {
    const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    if (isVercelKV) {
      // Use EX/PX for key expiration. PX is milliseconds.
      await kvRequest('SET', [key, JSON.stringify(value), 'PX', ttlMs]);
    } else {
      this.store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    }
  }

  async has(key: string): Promise<boolean> {
    const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    if (isVercelKV) {
      const res = await kvRequest('EXISTS', [key]);
      return Number(res) === 1;
    } else {
      return this.store.has(key) && (this.store.get(key)!.expiresAt > Date.now());
    }
  }

  async delete(key: string): Promise<void> {
    const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    if (isVercelKV) {
      await kvRequest('DEL', [key]);
    } else {
      this.store.delete(key);
    }
  }

  async clear(): Promise<void> {
    const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    if (isVercelKV) {
      // FLUSHDB or keys delete. Since it's developer sandbox, FLUSHDB might clear all.
      // Better to just log or do nothing unless needed.
      await kvRequest('FLUSHDB');
    } else {
      this.store.clear();
    }
  }

  get size(): number {
    // Clean expired entries
    for (const [key, entry] of this.store) {
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}

const cache = new SharedCache();
export default cache;
