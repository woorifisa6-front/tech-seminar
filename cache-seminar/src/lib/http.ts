export type FetchResult<T> = {
  data: T;
  from: "network:200" | "network:304";
  responseHeaders: Record<string, string>;
};

function headersToRecord(h: Headers) {
  const out: Record<string, string> = {};
  h.forEach((v, k) => (out[k.toLowerCase()] = v));
  return out;
}

export async function fetchJsonWithValidators<T>(args: {
  url: string;
  headers: Record<string, string>;
  signal: AbortSignal;
  prev?: { etag?: string; lastModified?: string };
  fallback: () => T | null;
}): Promise<FetchResult<T>> {
  const reqHeaders: Record<string, string> = { ...args.headers };

  if (args.prev?.etag) reqHeaders["if-none-match"] = args.prev.etag;
  if (args.prev?.lastModified)
    reqHeaders["if-modified-since"] = args.prev.lastModified;

  const res = await fetch(args.url, {
    method: "GET",
    headers: reqHeaders,
    signal: args.signal,
  });
  const rh = headersToRecord(res.headers);

  if (res.status === 304) {
    const fb = args.fallback();
    if (!fb) throw new Error("304인데 fallback 데이터가 없습니다.");
    return { data: fb, from: "network:304", responseHeaders: rh };
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as T;
  return { data, from: "network:200", responseHeaders: rh };
}
