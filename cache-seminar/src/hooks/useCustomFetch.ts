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
  enabled?: boolean;
  staleWhileRevalidate?: boolean;
};

type FetchState<T> = {
  data: T | null;
  isPending: boolean;
  isError: boolean;
  from: string;
};

export function useCustomFetch<T>(
  url: string,
  headers: Record<string, string>,
  options: UseCustomFetchOptions = {},
) {
  const staleTimeMs = options.staleTimeMs ?? 3000;
  const retryOpt = options.retry ?? defaultRetry;
  const enabled = options.enabled ?? true;
  const swr = options.staleWhileRevalidate ?? true;

  const cacheKey = useMemo(() => buildCacheKey(url, headers), [url, headers]);

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isPending: false,
    isError: false,
    from: "idle",
  });

  const { data, isPending, isError, from } = state;
  const abortRef = useRef<AbortController | null>(null);

  const clearCache = () => clearAllCache();

  useEffect(() => {
    if (!enabled) return;

    abortRef.current?.abort(); // 이전 요청 취소 (항상 최신 요청만 유효)
    abortRef.current = new AbortController(); // 새로운 AbortController 생성

    // 변수로 고정
    const controller = abortRef.current;
    const signal = controller.signal;

    // 1) Lookup - reacCache에서 Cache 가져와
    const cached = readCache<T>(cacheKey);
    const now = Date.now();

    setState((s) => ({
      ...s,
      isError: false,
    }));

    // 2) Fresh면 네트워크 0
    if (cached && isFresh(cached, now)) {
      setState({
        data: cached.data,
        isPending: false,
        isError: false,
        from: "cache:fresh(no-network)",
      });
      return () => controller.abort();
    }

    // 3) Stale이면 먼저 보여주기(SWR - 기본 true 설정)
    // SWR (오래된(stale) 데이터라도 일단 보여주고, 뒤에서 최신 데이터로 다시 검증/갱신)
    if (cached) {
      setState((s) => ({
        ...s,
        data: cached.data,
        from: "cache:stale(show-first)",
      }));
    }

    if (!swr && cached) {
      setState((s) => ({
        ...s,
        isPending: false,
        from: "cache:stale(no-revalidate)",
      }));
      return () => controller.abort();
    }

    // 4) dedupe (중복 요청 방지)
    const inflight = getInFlight<T>(cacheKey);
    if (inflight) {
      setState((s) => ({
        ...s,
        isPending: true,
        from: "dedupe:join-inflight",
      }));

      inflight
        .then((d) => {
          if (!signal.aborted) {
            setState((s) => ({
              ...s,
              data: d,
              isPending: false,
              isError: false,
            }));
          }
        })
        .catch(() => {
          if (!signal.aborted) {
            setState((s) => ({
              ...s,
              isError: true,
              isPending: false,
              from: "error",
            }));
          }
        });

      return () => controller.abort();
    }

    // 5) 네트워크 + retry + validators
    const run = (async () => {
      setState((s) => ({ ...s, isPending: true }));
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
            setState((s) => ({
              ...s,
              data: res.data,
              isPending: false,
              isError: false,
              from: res.from,
            }));
          }
          return res.data;
        } catch (e: any) {
          if (e?.name === "AbortError" || signal.aborted) throw e;

          if (attempt === retryOpt.retry) {
            if (!signal.aborted) {
              setState((s) => ({
                ...s,
                isError: true,
                isPending: false,
                from: "error",
              }));
            }
            throw e;
          }

          const delay = retryOpt.retryDelayMs(attempt);
          if (!signal.aborted) {
            setState((s) => ({
              ...s,
              from: `retrying(${attempt + 1}/${retryOpt.retry}) in ${delay}ms`,
            }));
          }
          await sleep(delay, signal);
        }
      }

      return null;
    })();

    setInFlight(cacheKey, run);

    return () => {
      controller.abort();
    };
  }, [url, cacheKey, staleTimeMs, enabled]);

  return { data, isPending, isError, from, clearCache };
}

function normalizeLower(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers))
    out[k.toLowerCase()] = String(v);
  return out;
}
