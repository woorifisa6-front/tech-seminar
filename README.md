# 📦 프론트엔드에서의 캐싱 (Frontend Caching)

> 프론트엔드 캐싱을 비롯해, **Custom Cache vs TanStack Query**를 바탕으로 캐싱 메커니즘을 이해한다.

---

## 📌 세미나 소개

**프론트엔드에서의 캐싱(Cache)** 이라는 주제를 중심으로, 다음과 같은 내용을 다룬다.
- 프론트엔드에서의 캐싱
- 캐싱 메커니즘의 이해
- 직접 구현(Custom Cache)과 라이브러리(TanStack Query) 구현 방법의 비교

---

## 🎯 세미나 목표

- **캐싱이 무엇인지**
- **캐싱이 언제/어떻게 동작하는지**(fresh/stale, TTL, 재검증, 중복 요청 방지)
- **Custom Cache**로 캐싱 메커니즘을 직접 구현하여 구조 파악
- **Custom caching과 TanStack Query와의 비교**

---

## 🧠 캐싱 메커니즘

### 1) 캐시 키(Cache Key)는 무엇으로 정하는가?
같은 API라도 **쿼리 파라미터/헤더/사용자 상태**에 따라 결과가 달라질 수 있기에 
cache key는 아래를 포함해야 한다.

- URL (path + querystring)
- 요청 헤더(인증/언어/디바이스 등 결과에 영향을 주는 값)
- 사용자 컨텍스트(로그인 여부 등)

키가 잘못되면?
- **다른 요청의 응답이 섞이는 캐싱 버그** 발생

---

### 2) 캐시는 언제 “신선(fresh)”하고 언제 “오래됨(stale)”인가?
캐시는 시간 기반으로 보통 다음 상태를 가진다.

- **fresh**: 재요청 없이 그대로 사용 가능
- **stale**: 오래된 데이터일 수 있어 재검증(또는 재요청) 필요

이에따라 핵심은 **TTL(Time To Live)** 이라는 것을 알 수 있다.

---

### 3) 중복 요청은 어떻게 막는가? (in-flight dedup)
사용자가 빠르게 화면 이동/리렌더링을 반복하면 같은 요청이 여러 번 날아갈 수 있다.

- 같은 key로 이미 요청 중이면
  - **기존 Promise를 재사용**하여 네트워크 요청을 하나로 줄임

---

### 4) stale-while-revalidate 전략이란?
stale 상태라도 UX를 위해:

1) **일단 캐시된 데이터로 즉시 렌더링**
2) 동시에 **백그라운드에서 재요청**
3) 최신 응답이 오면 **캐시 업데이트 + UI 갱신**

장점
- 화면이 빠르게 뜬다.
- 최신성도 유지

---

### 5) 실패/재시도 전략 (Retry)
네트워크는 항상 실패할 수 있으므로 캐싱 전략은 “실패”도 포함해야 한다.

- retry 횟수 / backoff(대기 시간)
- 특정 상태코드(예: 500)만 재시도
- 재시도 중에도 캐시된 데이터가 있다면 UI 유지

---

<img width="563" height="318" alt="스크린샷 2026-02-02 오후 3 54 16" src="https://github.com/user-attachments/assets/b1e4f112-a613-4ad6-8f08-ca2d28335ac4" />

## 구현 내용

### 1️⃣ Custom Cache 직접 구현
- In-memory 캐시 저장소 구현
- Cache Key 생성 로직
- TTL 기반 fresh/stale 판별
- in-flight 요청 중복 제거
- stale-while-revalidate 적용
- retry/backoff 적용

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
