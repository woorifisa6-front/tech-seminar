const inFlight = new Map<string, Promise<any>>();

export function getInFlight<T>(key: string): Promise<T> | null {
  return (inFlight.get(key) as Promise<T>) ?? null;
}

export function setInFlight<T>(key: string, p: Promise<T>) {
  inFlight.set(key, p);
  p.finally(() => inFlight.delete(key));
}
