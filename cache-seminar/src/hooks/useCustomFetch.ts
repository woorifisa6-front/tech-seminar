import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJsonWithValidators } from "../lib/http";
import { defaultRetry, type RetryOptions } from "../lib/retry";

export type UseCustomFetchOptions = {
  staleTimeMs?: number;
  retry?: RetryOptions;
  enabled?: boolean;
  staleWhileRevalidate?: boolean;
};

type FetchResult<T> = {
  data: T;
  from: string;
  meta?: {
    etag?: string;
    lastModified?: string;
  };
};

export function useRQFetch<T>(
  url: string,
  headers: Record<string, string>,
  options: UseCustomFetchOptions = {},
) {
  const queryClient = useQueryClient();

  const staleTimeMs = options.staleTimeMs ?? 3000;
  const retryOpt = options.retry ?? defaultRetry;
  const enabled = options.enabled ?? true;
  const swr = options.staleWhileRevalidate ?? true;

  // React Query의 queryKey는 "캐시 키" 역할
  const queryKey = useMemo(
    () => ["products", url, headers["accept-language"]],
    [url, headers],
  );

  const query = useQuery<FetchResult<T>, Error>({
    queryKey,
    enabled,
    staleTime: staleTimeMs,

    // swr=false면 stale이어도 자동 갱신을 최소화하는 방향으로 매핑
    // (완전히 "stale이면 끝"을 동일하게 만들긴 어렵고, 아래 옵션 조합이 가장 유사)
    refetchOnMount: swr ? "always" : false,
    refetchOnWindowFocus: swr,
    refetchOnReconnect: swr,

    // stale 데이터 유지(= 먼저 보여주기) 느낌을 위해
    placeholderData: (prev) => prev ?? undefined,

    // retry 매핑
    retry: retryOpt.retry,
    retryDelay: (attemptIndex) => retryOpt.retryDelayMs(attemptIndex),

    // queryFn: AbortSignal을 받아서 취소 가능
    queryFn: async ({ signal }) => {
      const prevCache = queryClient.getQueryData<FetchResult<T>>(queryKey);
      const prev = prevCache?.meta;

      const res = await fetchJsonWithValidators<T>({
        url,
        headers: normalizeLower(headers),
        signal,
        prev,
        fallback: () => null,
      });

      return {
        data: res.data,
        from: res.from,
        meta: {
          etag: res.responseHeaders["etag"],
          lastModified: res.responseHeaders["last-modified"],
        },
      };
    },
  });

  return {
    data: query.data?.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    from: query.data?.from ?? (query.isFetching ? "fetching" : "idle"),
    refetch: query.refetch,
  };
}

function normalizeLower(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers))
    out[k.toLowerCase()] = String(v);
  return out;
}
