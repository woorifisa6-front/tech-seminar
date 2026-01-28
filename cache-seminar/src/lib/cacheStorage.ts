export type CacheEntry<T> = {
  data: T;
  cachedAt: number; // 저장 시간
  staleTimeMs: number; // fresh window

  meta: {
    etag?: string;
    lastModified?: string;
  };
};

export function readCache<T>(key: string): CacheEntry<T> | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function writeCache<T>(key: string, entry: CacheEntry<T>) {
  localStorage.setItem(key, JSON.stringify(entry));
}

export function clearAllCache() {
  const keys = Object.keys(localStorage);
  for (const k of keys) {
    if (k.startsWith("httpcache:")) localStorage.removeItem(k);
  }
}

export function isFresh(entry: CacheEntry<any>, now = Date.now()) {
  return now - entry.cachedAt < entry.staleTimeMs;
}
