# 🧠 프론트엔드에서의 캐싱 (Frontend Caching)

> 프론트엔드 캐싱을 비롯해, **Custom Cache vs TanStack Query**를 바탕으로 캐싱 메커니즘을 이해한다.

---

## 📌 세미나 소개

**프론트엔드에서의 캐싱(Cache)** 이라는 주제를 중심으로, 다음과 같은 내용을 다룬다.
- 프론트엔드에서의 캐싱
- 캐싱 메커니즘의 이해
- 직접 구현(Custom Cache)과 라이브러리(TanStack Query) 구현 방법의 비교

---

## 🎯 세미나 목표

- 프론트엔드 캐싱의 **핵심 개념 이해**
- 캐시의 생명주기(Cache Lifecycle) 직접 설계
- **TanStack Query**와의 비교

---

## 🧩 구현 내용

### 1️⃣ Custom Cache 직접 구현
- In-memory 캐시 구조 설계
- TTL(Time To Live) 관리
- stale / fresh 상태 판별
- 요청 중복 방지 (in-flight 요청 관리)
- stale-while-revalidate 전략 적용

👉 **캐싱이 내부적으로 어떻게 동작하는지 깊이 이해할 수 있음**

---

### 2️⃣ TanStack Query 활용
- `useQuery` 기반 데이터 패칭
- `staleTime`, `gcTime` 설정
- 요청 상태 관리 (`loading`, `error`, `success`)

👉 **적은 코드로 안정적인 캐싱 구현 가능**

---

## ⚖️ Custom Cache vs TanStack Query 비교

| 항목 | Custom Cache | TanStack Query |
|----|----|----|
| 구현 복잡도 | 높음 | 낮음 |
| 코드 길이 | 김 | 짧음 |
| 유지보수 | 어려움 | 쉬움 |

---

## 📁 프로젝트 구조

```bash
server
 └─ server.js
src/
 ├─ lib/
 │   ├─ cacheKey.ts
 │   ├─ cacheStorage.ts
 │   ├─ retry.ts
 │   ├─ inFlight.ts
 │   └─ http.ts
 ├─ hooks/
 │   └─ useCustomFetch.ts
 └─ pages/
     └─ index.tsx
