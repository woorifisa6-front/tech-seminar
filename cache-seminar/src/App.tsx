import "./App.css";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Panel } from "./components/Panel";
import { useRQFetch } from "./hooks/useCustomFetch";
import { buildCacheKey } from "./lib/cacheKey";

const BASE = "http://localhost:3001";

type ProductsRes = {
  title: string;
  items: any[];
  serverVersion: number;
  now: number;
};

type UserRes = {
  user: any;
  serverVersion: number;
  now: number;
};

export default function App() {
  const queryClient = useQueryClient();

  const [lang, setLang] = useState<"en" | "ko">("en");
  const headers = useMemo(() => ({ "accept-language": lang }), [lang]);

  const products = useRQFetch<ProductsRes>(`${BASE}/api/products`, headers, {
    staleTimeMs: 3000,
    staleWhileRevalidate: true,
    retry: { retry: 2, retryDelayMs: (i) => Math.min(500 * 2 ** i, 4000) },
  });

  const user = useRQFetch<UserRes>(`${BASE}/api/user`, headers, {
    staleTimeMs: 1000,
    staleWhileRevalidate: true,
    retry: { retry: 1, retryDelayMs: (i) => 800 * 2 ** i },
  });

  const userQueryKey = useMemo(
    () => ["httpcache", buildCacheKey(`${BASE}/api/user`, headers)] as const,
    [headers],
  );

  const removeAll = () => {
    queryClient.removeQueries();
  };

  const updateUser = async () => {
    await fetch(`${BASE}/api/user`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `Alice-${Math.floor(Math.random() * 1000)}`,
      }),
    });

    queryClient.invalidateQueries({ queryKey: userQueryKey });
  };

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h2>useQuery 캐시로 React Query 흐름 보기</h2>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <button onClick={() => setLang((p) => (p === "en" ? "ko" : "en"))}>
          lang: {lang} (Vary)
        </button>

        <button onClick={removeAll}>Remove Cache (all)</button>

        <button onClick={updateUser}>PUT /api/user (서버 데이터 변경)</button>
      </div>

      <Panel title="Products (staleTime=3s → fresh면 네트워크 0)">
        <div>from: {products.from}</div>
        <div>
          pending: {String(products.isPending)} / error:{" "}
          {String(products.isError)}
        </div>
        <pre style={{ background: "#f7f7f7", padding: 12, color: "#111" }}>
          {JSON.stringify(products.data, null, 2)}
        </pre>
      </Panel>

      <Panel title="User (staleTime=1s)">
        <div>from: {user.from}</div>
        <div>
          pending: {String(user.isPending)} / error: {String(user.isError)}
        </div>
        <pre style={{ background: "#f7f7f7", padding: 12, color: "#111" }}>
          {JSON.stringify(user.data, null, 2)}
        </pre>
      </Panel>
    </div>
  );
}
