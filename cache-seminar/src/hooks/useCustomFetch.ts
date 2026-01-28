import { useEffect, useMemo, useRef, useState } from "react";
import { buildCacheKey } from "../lib/cacheKey";
import {
  clearAllCache,
  isFresh,
  readCache,
  writeCache,
  type CacheEntry,
} from "../lib/cacheStorage";
import { fetchJsonWithValidators } from "../lib/http";
import { defaultRetry, sleep, type RetryOptions } from "../lib/retry";
import { getInFlight, setInFlight } from "../lib/inFlight";

export type UseCustomFetchOptions = {
  staleTimeMs?: number;
  retry?: RetryOptions;
  staleWhileRevalidate?: boolean;
};

export function useCustomFetch<T>(
  url: string,
  headers: Record<string, string>,
  options: UseCustomFetchOptions = {},
) {
  const staleTimeMs = options.staleTimeMs ?? 3000;
  const retryOpt = options.retry ?? defaultRetry;
  const swr = options.staleWhileRevalidate ?? true;

  const cacheKey = useMemo(() => buildCacheKey(url, headers), [url, headers]);

  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [from, setFrom] = useState("idle");

  const abortRef = useRef<AbortController | null>(null);

  const clearCache = () => clearAllCache();

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const controller = abortRef.current;
    const signal = controller.signal;

    setIsError(false);

    // 1) Cache lookup
    const cached = readCache<T>(cacheKey);
    const now = Date.now();

    // 2) Fresh → 네트워크 요청 안 함
    if (cached && isFresh(cached, now)) {
      setData(cached.data);
      setIsPending(false);
      setFrom("cache:fresh(no-network)");
      return () => controller.abort();
    }

    // 3) Stale → 먼저 보여주기 (SWR)
    if (cached) {
      setData(cached.data);
      setFrom("cache:stale(show-first)");
    }

    // SWR 끄면 여기서 종료
    if (!swr && cached) {
      setIsPending(false);
      setFrom("cache:stale(no-revalidate)");
      return () => controller.abort();
    }

    // 4) dedupe
    const inflight = getInFlight<T>(cacheKey);
    if (inflight) {
      setIsPending(true);
      setFrom("dedupe:join-inflight");
      inflight
        .then((d) => {
          if (!signal.aborted) {
            setData(d);
            setIsPending(false);
          }
        })
        .catch(() => {
          if (!signal.aborted) {
            setIsError(true);
            setIsPending(false);
          }
        });
      return () => controller.abort();
    }

    // 5) 네트워크 + retry + validators
    const run = (async () => {
      setIsPending(true);
      const prev = cached?.meta;

      for (let attempt = 0; attempt <= retryOpt.retry; attempt++) {
        try {
          const res = await fetchJsonWithValidators<T>({
            url,
            headers: normalizeLower(headers),
            signal,
            prev,
            fallback: () => readCache<T>(cacheKey)?.data ?? null,
          });

          const nextEntry: CacheEntry<T> = {
            data: res.data,
            cachedAt: Date.now(),
            staleTimeMs,
            meta: {
              etag: res.responseHeaders["etag"],
              lastModified: res.responseHeaders["last-modified"],
            },
          };

          writeCache(cacheKey, nextEntry);

          if (!signal.aborted) {
            setData(res.data);
            setFrom(res.from);
            setIsPending(false);
          }
          return res.data;
        } catch (e: any) {
          if (e?.name === "AbortError" || signal.aborted) throw e;

          if (attempt === retryOpt.retry) {
            if (!signal.aborted) {
              setIsError(true);
              setIsPending(false);
              setFrom("error");
            }
            throw e;
          }

          const delay = retryOpt.retryDelayMs(attempt);
          setFrom(`retrying(${attempt + 1}/${retryOpt.retry}) in ${delay}ms`);
          await sleep(delay, signal);
        }
      }
    })();

    setInFlight(cacheKey, run);

    return () => {
      controller.abort();
    };
  }, [url, cacheKey, staleTimeMs]);

  return { data, isPending, isError, from, clearCache };
}

function normalizeLower(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k.toLowerCase()] = String(v);
  }
  return out;
}
