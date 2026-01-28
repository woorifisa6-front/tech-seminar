export type RetryOptions = {
  retry: number;
  retryDelayMs: (attemptIndex: number) => number;
};

export const defaultRetry: RetryOptions = {
  retry: 3,
  retryDelayMs: (i) => Math.min(1000 * 2 ** i, 30_000),
};

export async function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);

    const onAbort = () => {
      clearTimeout(id);
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
