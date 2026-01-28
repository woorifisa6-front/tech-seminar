import "./App.css";
import React, { useMemo, useState } from "react";
import { useCustomFetch } from "./hooks/useCustomFetch";
import { Panel } from "./components/Panel";

const BASE = "http://localhost:3001";

type ProductsRes = {
  title: string;
  items: any[];
  serverVersion: number;
  now: number;
};
type UserRes = { user: any; serverVersion: number; now: number };

export default function App() {
  const [lang, setLang] = useState<"en" | "ko">("en");
  const [showUser, setShowUser] = useState(true);

  const headers = useMemo(() => ({ "accept-language": lang }), [lang]);

  const products = useCustomFetch<ProductsRes>(
    `${BASE}/api/products`,
    headers,
    {
      staleTimeMs: 3000,
      staleWhileRevalidate: true,
      retry: { retry: 2, retryDelayMs: (i) => Math.min(500 * 2 ** i, 4000) },
    },
  );

  const user = useCustomFetch<UserRes>(`${BASE}/api/user`, headers, {
    staleTimeMs: 0,
    staleWhileRevalidate: true,
    enabled: showUser,
    retry: { retry: 1, retryDelayMs: (i) => 800 * 2 ** i },
  });

  const updateUser = async () => {
    await fetch(`${BASE}/api/user`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `Alice-${Math.floor(Math.random() * 1000)}`,
      }),
    });
    user.clearCache(); // 데모: 이벤트 발생 시 캐시 무효화 느낌
  };

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h2>useEffect + localStorage 캐시로 React Query 흉내</h2>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <button onClick={() => setLang((p) => (p === "en" ? "ko" : "en"))}>
          lang: {lang} (Vary)
        </button>
        <button onClick={() => setShowUser((v) => !v)}>
          {showUser ? "Unmount" : "Mount"} User (재검증 체감)
        </button>
        <button onClick={() => products.clearCache()}>Clear Cache (all)</button>
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

      <Panel title="User (staleTime=0, mount마다 재요청 체감)">
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
