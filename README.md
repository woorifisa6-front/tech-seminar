# 🧠 프론트엔드에서의 캐싱 (Frontend Caching)

> 프론트엔드 캐싱의 개념부터 실제 구현까지 비교·분석하는 학습용 프로젝트  
> **Custom Cache 구현 vs TanStack Query 활용**을 중심으로 캐싱 전략을 이해한다.

---

## 📌 프로젝트 소개

이 프로젝트는 **프론트엔드에서의 캐싱(Cache)** 이라는 주제를 중심으로,

- 캐싱이 왜 필요한지
- 프론트엔드에서 캐싱을 어떻게 구현할 수 있는지
- 직접 구현(Custom Cache)과 라이브러리(TanStack Query)의 차이는 무엇인지

를 **직접 코드로 구현하고 비교**하기 위해 만들어진 학습 프로젝트입니다.

---

## 🎯 프로젝트 목표

- 프론트엔드 캐싱의 **핵심 개념 이해**
- 캐시의 생명주기(Cache Lifecycle) 직접 설계
- 실무에서 많이 사용하는 **TanStack Query**와의 비교
- 캐싱 전략 선택에 대한 **기준과 판단 근거 확보**

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
- `staleTime`, `cacheTime` 설정
- 자동 refetch / background fetch
- 요청 상태 관리 (`loading`, `error`, `success`)

👉 **적은 코드로 안정적인 캐싱 구현 가능**

---

## ⚖️ Custom Cache vs TanStack Query 비교

| 항목 | Custom Cache | TanStack Query |
|----|----|----|
| 구현 난이도 | 높음 | 낮음 |
| 코드 길이 | 김 | 짧음 |
| 학습 효과 | 매우 높음 | 중간 |
| 실무 적합성 | 낮음 | 매우 높음 |
| 유지보수 | 어려움 | 쉬움 |

---

## 🧠 비교 정리

- **Custom Cache**
  - 캐싱의 원리를 깊이 이해하는 데 매우 효과적
  - 직접 구현하면서 설계 능력 향상
  - 하지만 코드 복잡도가 높고 유지보수가 어려움

- **TanStack Query**
  - 실무에서 바로 사용 가능
  - 안정성과 생산성이 매우 높음
  - 내부 동작을 깊이 파악하기엔 한계가 있음

---

## 언제 어떤 선택을 해야 할까?

| 상황 | 추천 |
|----|----|
| 캐싱 원리 학습 | ✅ Custom Cache |
| 실무 프로젝트 | ✅ TanStack Query |
| 포트폴리오/발표 | ✅ 둘 다 |
| 빠른 개발 | ✅ TanStack Query |

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
