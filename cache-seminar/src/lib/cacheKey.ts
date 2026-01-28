export function buildCacheKey(url: string, headers: Record<string, string>) {
  const lang = headers["accept-language"] ?? "";
  return `httpcache:${url}::lang=${lang}`;
}
